#!/usr/bin/env bash
# GitHub Pages デプロイスクリプト。
# basePath=/nou-denchi でビルドし、out/ を gh-pages ブランチとして force push する。
# 使い方: npm run deploy:pages (要: gh auth login 済み + gh auth setup-git 済み)
set -euo pipefail
cd "$(dirname "$0")/.."

NEXT_PUBLIC_BASE_PATH=/nou-denchi npm run build

cd out
touch .nojekyll                 # Jekyll 処理を無効化(_next/ ディレクトリ保護)
find . -name .DS_Store -delete  # macOS ゴミファイル除外
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "deploy: GitHub Pages (basePath=/nou-denchi)"
git push --force https://github.com/Mark555Limitless/nou-denchi.git HEAD:gh-pages
rm -rf .git

echo "deployed: https://mark555limitless.github.io/nou-denchi/"
