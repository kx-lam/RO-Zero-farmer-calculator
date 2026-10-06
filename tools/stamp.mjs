// Gives every local script and stylesheet in index.html a ?v= of its own content hash, so a browser never runs a new page with an
// old cached file (or the other way round) after a deploy. Run after changing any of them: node tools/stamp.mjs  (--check only reports)
import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { pathToFileURL } from "url";

const root = new URL("../", import.meta.url);
// CRLF is read as LF, so a Windows checkout stamps the same hashes as the LF files that get deployed
export const hashOf = path => createHash("sha256").update(readFileSync(new URL(path, root), "utf8").replace(/\r\n/g, "\n")).digest("hex").slice(0, 10);
// the stamped page: each local src="…" / href="…" (not http, not #) with ?v= set to that file's hash
export const stamp = html => html.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=")(?![a-z]+:|\/\/|#)([^"?]+)(?:\?v=[^"]*)?"/g,
  (_, pre, path) => `${pre}${path}?v=${hashOf(path)}"`);

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL("index.html", root), html = readFileSync(file, "utf8"), out = stamp(html);
  if (process.argv.includes("--check")) { if (out !== html) { console.error("index.html file stamps are stale: run node tools/stamp.mjs"); process.exit(1) } console.log("stamps up to date") }
  else { writeFileSync(file, out); console.log(out === html ? "stamps already up to date" : "index.html stamps updated") }
}
