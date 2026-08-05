import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // iOSアプリ(Capacitor)は out/ のビルド成果物をそのまま同梱するだけなので
    // 生成物を lint 対象にしない(2026-08-05)
    "ios/**",
  ]),
]);

export default eslintConfig;
