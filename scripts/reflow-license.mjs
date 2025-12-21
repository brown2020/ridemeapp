import fs from "node:fs";
import path from "node:path";

const targetPath = path.resolve(process.cwd(), "license.md");
const input = fs.readFileSync(targetPath, "utf8");

const lines = input.replace(/\r\n/g, "\n").split("\n");
const out = [];

/** Treat these as "verbatim" blocks (do not reflow). */
function isVerbatimLine(line) {
  // Indented examples / lettered clauses / placeholders
  if (/^\s{4,}/.test(line)) return true;
  // Bullet lists (none currently, but safe)
  if (/^(\*|-)\s+/.test(line)) return true;
  return false;
}

function isHeadingLine(line) {
  return /^#{1,6}\s+/.test(line);
}

function flushParagraph(buffer) {
  if (buffer.length === 0) return;
  // Join with single spaces, preserving internal spacing inside each line.
  // Also avoid adding extra spaces around em-dash patterns.
  const joined = buffer
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, (m) => (m.length >= 2 ? "  " : m)); // preserve double-spaces if they were introduced (rare)
  out.push(joined);
  buffer.length = 0;
}

let paragraph = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i] ?? "";

  // Blank line => end paragraph
  if (line.trim() === "") {
    flushParagraph(paragraph);
    out.push("");
    continue;
  }

  // Headings => end paragraph + keep as-is
  if (isHeadingLine(line)) {
    flushParagraph(paragraph);
    out.push(line.trimEnd());
    continue;
  }

  // Verbatim blocks => end paragraph + keep as-is
  if (isVerbatimLine(line)) {
    flushParagraph(paragraph);
    out.push(line.trimEnd());
    continue;
  }

  // Normal prose: accumulate
  paragraph.push(line);
}

flushParagraph(paragraph);

// Trim excessive trailing blank lines (keep at most one)
while (
  out.length > 0 &&
  out[out.length - 1] === "" &&
  out[out.length - 2] === ""
) {
  out.pop();
}

fs.writeFileSync(targetPath, out.join("\n"), "utf8");
console.log(`Reflowed paragraphs in ${targetPath}`);
