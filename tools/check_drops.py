"""Cross-check data/loot.js and data/items.js against ragnarokzero.net monster pages.

Lists, per monster, drops ragnarokzero.net has that data/loot.js doesn't (or the other way round), drop rates that
differ, and item names that are missing from or differ in data/items.js. Drops with no known rate ("???") are left out,
as data/loot.js leaves them out too. Loot value per kill isn't compared: the two sites price items differently.
It fetches one page per monster (about 250), so it takes a few minutes.
Run: python tools/check_drops.py
"""
import json
import re
import time
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def js_object(name, var):
    src = (DATA / f"{name}.js").read_text(encoding="utf-8")
    start = src.index("{", src.index(f"const {var}="))
    return json.loads(src[start:src.index("};", start) + 1])


def page_drops(mob_id):
    url = f"https://ragnarokzero.net/database/monsters/{mob_id}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            page = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
            break
        except OSError:
            if attempt == 2:
                raise
            time.sleep(5)
    # the drop list is in the page's Next.js payload: self.__next_f.push([1,"..."])
    payload = "".join(json.loads('"' + c + '"') for c in re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', page, flags=re.S))
    k = payload.find('{"drops":[')
    return json.JSONDecoder().raw_decode(payload, k)[0]["drops"] if k >= 0 else []


def main():
    loot, names = js_object("loot", "LOOT"), js_object("items", "ITEMN")
    issues = 0
    for mob_id in sorted(loot, key=int):
        ours = {it: rate for it, rate in loot[mob_id][3]}
        theirs = {x["itemId"]: x for x in page_drops(mob_id)}
        time.sleep(0.5)
        lines = []
        for it, x in theirs.items():
            if x["rate"] is None:
                continue
            if it not in ours:
                lines.append(f"  missing {x['name']} #{it} {x['rate']}%")
            elif abs(ours[it] - x["rate"]) > 1e-9:
                lines.append(f"  {x['name']} #{it}: ours {ours[it]}%, theirs {x['rate']}%")
            if names.get(str(it)) != x["name"]:
                lines.append(f"  item name #{it}: ours {names.get(str(it))!r}, theirs {x['name']!r}")
        for it, rate in ours.items():
            if it not in theirs:
                lines.append(f"  extra {names.get(str(it), '?')} #{it} {rate}% (not on ragnarokzero.net)")
        if lines:
            print(f"#{mob_id}")
            print("\n".join(lines))
            issues += len(lines)
    print(f"{issues} differences")


if __name__ == "__main__":
    main()
