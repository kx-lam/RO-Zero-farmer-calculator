// index.html loads each script and stylesheet as file?v=<its content hash>, so a deploy never mixes a new page with old cached files.
// Run: node tests/stamp.test.mjs  (if it fails, run node tools/stamp.mjs)
import { readFileSync } from "fs";
import assert from "assert/strict";
import { stamp, hashOf } from "../tools/stamp.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const local = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="(?![a-z]+:|\/\/|#)([^"]+)"/g)].map(m => m[1]);
assert.ok(local.length > 20, `only ${local.length} local files found`);
for (const u of local) assert.match(u, /\?v=[0-9a-f]{10}$/, `${u} has no ?v= stamp: run node tools/stamp.mjs`);
assert.equal(stamp(html), html, "index.html stamps are stale: run node tools/stamp.mjs");
assert.notEqual(hashOf("js/events.js"), hashOf("js/state.js"));
console.log(`ok ${local.length} files stamped with their current hash`);
console.log("1 tests passed");
