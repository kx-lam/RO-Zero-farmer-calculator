"""Export item weights for every monster drop into data/weights.js, from rAthena's renewal item database.

    python tools/export_weights.py

Weights are the classic ones rAthena keeps (in tenths, so Jellopy's 10 is 1.0). NPC prices in rAthena don't match
Ragnarok Zero, so only the weights are taken. Items rAthena doesn't have (Zero-only ids) are listed at the end; they
count as weightless until they're added by hand or from an online database.
"""
import json, re, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = "https://raw.githubusercontent.com/rathena/rathena/master/db/re/{}.yml"


def js_object(name, var):
    src = (ROOT / "data" / f"{name}.js").read_text(encoding="utf-8")
    start = src.index("{", src.index(f"const {var}="))
    return json.loads(src[start:src.index("};", start) + 1])


def main():
    weight = {}
    for f in ("item_db_etc", "item_db_usable", "item_db_equip"):
        cur = None
        text = urllib.request.urlopen(SRC.format(f), timeout=120).read().decode("utf-8")
        for line in text.splitlines():
            m = re.match(r"  - Id: (\d+)", line)
            if m:
                cur = m.group(1)
                weight[cur] = 0  # no Weight line means weightless
                continue
            m = re.match(r"    Weight: (\d+)", line)
            if m and cur:
                weight[cur] = int(m.group(1)) / 10
    drops = sorted({str(i) for _, _, _, ds in js_object("loot", "LOOT").values() for i, _ in ds}, key=int)
    out = {i: (int(weight[i]) if weight[i] == int(weight[i]) else weight[i]) for i in drops if i in weight}
    missing = [i for i in drops if i not in weight]
    body = "const ITEMW=" + json.dumps(out, separators=(",", ":")) + ";"
    (ROOT / "data" / "weights.js").write_text(
        "// Item weight by id for every monster drop (rAthena renewal item_db, written by tools/export_weights.py)\n" + body + "\n",
        encoding="utf-8", newline="\n")
    print(f"wrote {len(out)} weights; {len(missing)} drops not in rAthena: {', '.join(missing)}")


if __name__ == "__main__":
    main()
