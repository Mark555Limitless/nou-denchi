import { featureFlags, SCHEMA_VERSION } from "@/lib/config";
import {
  beatBaseline,
  computeTimeBandBaseline,
} from "@/lib/engine/baseline";
import {
  computePercent,
  displayPercent,
  scoreSession,
  zoneOf,
  type DisplayPercent,
} from "@/lib/engine/scoring";
import { dayKeyOf, timeBandOf } from "@/lib/engine/timeBand";
import type {
  BaselineType,
  SessionScore,
  SessionSummary,
  TaskResults,
  TimeBand,
  Zone,
} from "@/lib/engine/types";
import { db, type SessionRecord, type UserProfile } from "@/lib/db/db";
import {
  getBaseline,
  getProfile,
  getSession,
  listSessions,
  putBaseline,
  deleteBaseline,
} from "@/lib/db/repo";

/**
 * 測定セッションの完了処理(採点 → 保存 → ベースライン状態遷移)。
 * エンジン純粋関数と DB をつなぐ唯一のオーケストレーション層。
 *
 * ベースライン仕様(2026-07-31 ユーザー指示で§3.3を上書き):
 * 「その時点までに計測された最高スコア」が常に100%の基準(MAX)。
 * - 初回測定はそのままMAXとして登録され、その測定は100%になる
 * - 以降、MAXを超えるスコアが出るたびに即時そのスコアへ更新(ベスト更新)
 * - 暫定ベースライン(年代×時間帯テーブル)・7回のベスト計測(確定条件)は廃止
 */

const TIME_BANDS: TimeBand[] = ["morning", "day", "evening", "night"];

export interface CompletionResult {
  session: SessionRecord;
  score: SessionScore;
  /** 実値%(クリップ前) */
  percent: number;
  display: DisplayPercent;
  zone: Zone;
  baselineType: BaselineType;
  baselineValue: number;
  /** 初回測定で「キミの100%」が登録されたか(§6.4 シェアモーメント②) */
  baselineConfirmedNow: boolean;
  /** ベスト更新演出(§3.3(d)改: MAX直接更新) */
  bestUpdated: boolean;
}

function toSummary(s: SessionRecord): SessionSummary {
  return {
    id: s.id,
    startedAt: s.startedAt,
    timeBand: s.timeBand,
    rawScore: s.rawScore,
    isCalibration: s.isCalibration,
  };
}

export async function completeSession(
  taskResults: TaskResults,
  startedAt: number,
  seed: string,
  mathSigs: string[] = [],
): Promise<CompletionResult> {
  const profile = await getProfile();
  const calibStart = profile?.calibrationStartAt ?? 0;
  const score = scoreSession(taskResults);
  const band = timeBandOf(new Date(startedAt));
  const globalBl = await getBaseline("global");
  // MAX未登録=初回測定(リセット直後含む)
  const isFirst = !globalBl;

  // % 算出に使うベースラインの解決(時間帯別MAX → 全体MAX → 初回は自分自身=100%)
  let baselineType: BaselineType;
  let baselineValue: number;
  if (isFirst) {
    baselineType = "personal";
    baselineValue = score.rawScore;
  } else {
    const bandBl = featureFlags.timeBandBaseline
      ? await getBaseline(band)
      : undefined;
    if (bandBl) {
      baselineType = "personalTimeBand";
      baselineValue = bandBl.value;
    } else {
      baselineType = "personal";
      baselineValue = globalBl.value;
    }
  }
  const percent = computePercent(score.rawScore, baselineValue);

  const session: SessionRecord = {
    id: crypto.randomUUID(),
    startedAt,
    timeBand: band,
    taskResults,
    rawScore: score.rawScore,
    percent,
    baselineType,
    isCalibration: isFirst,
    seed,
    mathSigs,
    schemaVersion: SCHEMA_VERSION,
  };
  await db.sessions.add(session);

  let baselineConfirmedNow = false;
  let bestUpdated = false;

  if (isFirst) {
    // 初回測定: このスコアがそのまま「キミの100%」(MAX)として登録される
    await putBaseline({
      scope: "global",
      value: score.rawScore,
      sourceSessionIds: [session.id],
      updatedAt: startedAt,
    });
    baselineConfirmedNow = true;
  } else {
    // MAX更新: 現在のMAXを超えたスコアはそのまま新しいMAXとして登録
    const beat = beatBaseline(globalBl.value, score.rawScore, session.id);
    if (beat) {
      bestUpdated = true;
      await putBaseline({
        scope: "global",
        value: beat.value,
        sourceSessionIds: beat.sourceSessionIds,
        updatedAt: startedAt,
      });
    }
  }

  // 時間帯別ベースライン(区分内MAX・§3.3(c)改)の再計算
  if (featureFlags.timeBandBaseline) {
    const all = (await listSessions()).map(toSummary);
    const eligible = all.filter((s) => s.startedAt >= calibStart);
    for (const b of TIME_BANDS) {
      const comp = computeTimeBandBaseline(eligible, b, startedAt);
      if (comp) {
        await putBaseline({
          scope: b,
          value: comp.value,
          sourceSessionIds: comp.sourceSessionIds,
          updatedAt: startedAt,
        });
      } else {
        await deleteBaseline(b);
      }
    }
  }

  return {
    session,
    score,
    percent,
    display: displayPercent(percent),
    zone: zoneOf(percent),
    baselineType,
    baselineValue,
    baselineConfirmedNow,
    bestUpdated,
  };
}

export interface HomeState {
  profile: UserProfile | undefined;
  /** 今日測定済みの最新セッション(未測定なら undefined) */
  todaySession: SessionRecord | undefined;
  latestSession: SessionRecord | undefined;
  /** MAX(100%基準)が登録済みか(=1回でも測定済みか) */
  baselineConfirmed: boolean;
}

export async function getHomeState(now = Date.now()): Promise<HomeState> {
  const profile = await getProfile();
  const sessions = await listSessions();
  const globalBl = await getBaseline("global");
  const todayKey = dayKeyOf(now);
  const todaySession = [...sessions]
    .reverse()
    .find((s) => dayKeyOf(s.startedAt) === todayKey);
  return {
    profile,
    todaySession,
    latestSession: sessions[sessions.length - 1],
    baselineConfirmed: !!globalBl,
  };
}

/** 結果画面用: 保存済みセッションの表示情報を復元 */
export interface SessionView {
  session: SessionRecord;
  score: SessionScore;
  percent: number;
  display: DisplayPercent;
  zone: Zone;
}

export async function getSessionView(
  id: string,
): Promise<SessionView | undefined> {
  const session = await getSession(id);
  if (!session) return undefined;
  const score = scoreSession(session.taskResults);
  const percent = session.percent ?? 0;
  return {
    session,
    score,
    percent,
    display: displayPercent(percent),
    zone: zoneOf(percent),
  };
}
