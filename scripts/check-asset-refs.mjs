import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".ts", ".tsx", ".css"]);
const patterns = [
  // JSX: src="/...", src={'/...'}, src={`/...`} (// URLs are excluded).
  /(?<![\w$.-])src\s*=\s*(?:["']\/(?!\/)|\{\s*["'`]\/(?!\/))/g,
  // Canvas / DOM image assignments, including template literals.
  /\.\s*src\s*=\s*["'`]\/(?!\/)/g,
  // CSS files and inline CSS strings.
  /\burl\(\s*["']?\/(?!\/)/gi,
];

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(file));
    else if (entry.isFile() && extensions.has(path.extname(file))) files.push(file);
  }
  return files.sort();
}

const files = collectFiles(path.join(root, "src"));
let violations = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  const offendingLines = new Set();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      offendingLines.add(source.slice(0, match.index).split("\n").length);
    }
  }
  for (const line of [...offendingLines].sort((a, b) => a - b)) {
    console.error(`${path.relative(root, file)}:${line}: ${lines[line - 1].trim()}`);
    violations++;
  }
}

if (violations === 0) {
  console.log(`check-asset-refs: OK (${files.length} files)`);
} else {
  process.exitCode = 1;
}
