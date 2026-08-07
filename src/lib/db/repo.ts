import { BOOST_BEST_KEY, SCHEMA_VERSION } from "@/lib/config";
import type { AgeBand, BaselineScope } from "@/lib/engine/types";
import { db, type BaselineRecord, type SessionRecord, type UserProfile } from "./db";

/** 単一プロファイル運用のための固定キー */
const PROFILE_ID = "local";

export async function getProfile(): Promise<UserProfile | undefined> {
  return db.profile.get(PROFILE_ID);
}

export interface ProfileInput {
  ageBand?: AgeBand;
  /** 夜勤UIは削除済み(DECISIONS.md)。互換のため任意で受け付け、既定 false */
  isShiftWorker?: boolean;
  reminderNote?: string;
}

/** オンボーディング完了時に作成。既存があれば設定のみ更新。 */
export async function saveProfile(input: ProfileInput): Promise<UserProfile> {
  const existing = await getProfile();
  const profile: UserProfile = existing
    ? { ...existing, ...input }
    : {
        id: PROFILE_ID,
        isShiftWorker: false,
        ...input,
        createdAt: Date.now(),
        calibrationStartAt: Date.now(),
        schemaVersion: SCHEMA_VERSION,
      };
  await db.profile.put(profile);
  return profile;
}

export async function updateProfile(
  patch: Partial<Omit<UserProfile, "id">>,
): Promise<void> {
  await db.profile.update(PROFILE_ID, patch);
}

export async function listSessions(): Promise<SessionRecord[]> {
  return db.sessions.orderBy("startedAt").toArray();
}

export async function listSessionsSince(since: number): Promise<SessionRecord[]> {
  return db.sessions.where("startedAt").aboveOrEqual(since).sortBy("startedAt");
}

export async function getSession(id: string): Promise<SessionRecord | undefined> {
  return db.sessions.get(id);
}

export async function getLatestSession(): Promise<SessionRecord | undefined> {
  return db.sessions.orderBy("startedAt").last();
}

export async function getBaseline(
  scope: BaselineScope,
): Promise<BaselineRecord | undefined> {
  return db.baselines.get(scope);
}

export async function putBaseline(rec: BaselineRecord): Promise<void> {
  await db.baselines.put(rec);
}

export async function deleteBaseline(scope: BaselineScope): Promise<void> {
  await db.baselines.delete(scope);
}

/**
 * ベースライン再計測(§4.6): ベースラインを破棄し、
 * 以後のセッションだけで新しいベスト計測ウィークを始める。履歴は残す。
 */
export async function resetCalibration(): Promise<void> {
  await db.baselines.clear();
  await updateProfile({ calibrationStartAt: Date.now() });
}

/**
 * データ全削除(§4.6)。IndexedDB の全テーブルに加え、localStorage に持つ
 * BOOST!! 自己ベストも消す(ポリシー「全消去できます」との整合。2026-08-08)。
 */
export async function wipeAllData(): Promise<void> {
  await Promise.all([
    db.profile.clear(),
    db.sessions.clear(),
    db.baselines.clear(),
  ]);
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(BOOST_BEST_KEY);
  }
}
