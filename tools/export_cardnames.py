"""Export the name each card adds to the gear it's in (the equipment window shows "Healing Shining Clip", not the Vitata Card)
into data/cardnames.js.

    python tools/export_cardnames.py            # fetch what isn't cached, then write data/cardnames.js
    python tools/export_cardnames.py --refresh  # refetch every card

Names come from divine-pride.net's item pages (the "Prefix" row; a name starting with "of " goes after the item name, like
"Boots of Health"). Cards are the ones in data/cards.js. Pages are fetched one per second and cached in tools/cache/
(gitignored). Delete a cached file to refetch it. Cards divine-pride has no English name for are left out and listed at the end.
"""
import html, json, os, re, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", "cache")
SITE = "https://www.divine-pride.net"
UA = "RO-Zero-farmer-calculator data export"
# names divine-pride has only in Korean, as the Global equipment window shows them; other non-English names are left out
GLOBAL = {300835: "Shark Family"}  # "+4 Shark Family Muffler"


def card_ids():
    src = open(os.path.join(ROOT, "data", "cards.js"), encoding="utf-8").read()
    start = src.index("[", src.index("const CARDS="))
    return [(c["id"], c["name"]) for c in json.loads(src[start:src.rindex("]") + 1])]


def page(item_id, refresh=False):
    f = os.path.join(CACHE, f"divinepride_item_{item_id}.html")
    if os.path.exists(f) and not refresh:
        return open(f, encoding="utf-8").read()
    req = urllib.request.Request(f"{SITE}/database/item/{item_id}", headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                text = r.read().decode("utf-8")
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ""
            if attempt == 2:
                raise
            time.sleep(5)
        except OSError:
            if attempt == 2:
                raise
            time.sleep(5)
    os.makedirs(CACHE, exist_ok=True)
    open(f, "w", encoding="utf-8").write(text)
    time.sleep(1)
    return text


def prefix(text):
    m = re.search(r'<td class="text-muted">\s*Prefix\s*</td>\s*<td>(.*?)</td>', text, re.S)
    return html.unescape(re.sub(r"<[^>]*>", "", m.group(1))).strip() if m else ""


def main():
    refresh = "--refresh" in sys.argv
    names, missing = {}, []
    cards = card_ids()
    for i, (cid, name) in enumerate(cards, 1):
        p = GLOBAL.get(cid) or prefix(page(cid, refresh))
        if p and p.isascii():
            names[cid] = p
        else:
            missing.append(f"{cid} {name}")
        if i % 25 == 0:
            print(f"{i}/{len(cards)}", flush=True)
    body = ",\n".join(f"{k}:{json.dumps(v, ensure_ascii=False)}" for k, v in sorted(names.items()))
    with open(os.path.join(ROOT, "data", "cardnames.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// The name each card adds to the gear it's in, as the equipment window shows it (card id -> name; a name starting with \"of \"\n"
                "// goes after the item name). From divine-pride.net, written by tools/export_cardnames.py.\n"
                "const CARDNAMES={" + body + "};\n")
    print(f"{len(names)} card names written")
    if missing:
        print(f"{len(missing)} cards without a name: " + ", ".join(missing))


if __name__ == "__main__":
    main()
