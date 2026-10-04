"""Export NPC sell prices and item types for every item monsters drop (data/loot.js) into data/prices.js and data/itemtypes.js.

    python tools/export_prices.py            # fetch what isn't cached, then write data/prices.js and data/itemtypes.js
    python tools/export_prices.py --refresh  # refetch every item (prices changed after a patch)

Prices come from rozerodb.com's item API (/api/items/<id>: buy_price, sell_price), the site data/loot.js came from, so
they should add up to its loot value per kill. Not from rAthena: its prices don't match RO Zero.
Items are fetched one per second and cached in tools/cache/ (gitignored). Delete a cached file to refetch it.
Items rozerodb has no sell price for are written as null (roz.prontera.info and ragnarokzero.net had none for the ones checked either).
Item types follow the in-game auto-loot (Looting tab) groups; see loot_type().
Then it checks every monster: sum(sell x chance / 100) over its drops should round to LOOT[id][0]. It prints how many
match, the worst mismatches, and the items it couldn't price.
"""
import json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
CACHE = os.path.join(ROOT, "tools", "cache")
SITE = "https://rozerodb.com"
UA = "RO-Zero-farmer-calculator data export"


def js_object(name, var):
    src = open(os.path.join(DATA, f"{name}.js"), encoding="utf-8").read()
    start = src.index("{", src.index(f"const {var}="))
    return json.loads(src[start:src.index("};", start) + 1])


def item(item_id, refresh=False):
    """rozerodb's item record, or None when it has no such item. Cached as JSON."""
    f = os.path.join(CACHE, f"rozerodb_item_{item_id}.json")
    if os.path.exists(f) and not refresh:
        return json.load(open(f, encoding="utf-8"))
    req = urllib.request.Request(f"{SITE}/api/items/{item_id}", headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                rec = json.loads(r.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                rec = None
                break
            if attempt == 2:
                raise
            time.sleep(5)
        except OSError:
            if attempt == 2:
                raise
            time.sleep(5)
    if rec is not None:
        rec.pop("raw_json", None)  # big (drop lists, descriptions) and not needed
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(f, "w", encoding="utf-8"))
    time.sleep(1)
    return rec


# rozerodb category -> in-game auto-loot group: w weapon, a armor, u consumable, c card, e miscellaneous, o costume.
# Taming items (category Pet) are usable, so they loot as consumables; ETC and Other are both miscellaneous.
# A few records have no category: the ones with a weapon slot (in Chinese, e.g. 短劍 dagger) are weapons, the rest are ETC drops
LOOT_TYPE = {"Weapon": "w", "Armor": "a", "Consumable": "u", "Pet": "u", "Card": "c", "ETC": "e", "Other": "e"}


def loot_type(rec):
    if not rec:
        return "e"
    if rec.get("costume"):
        return "o"
    cat = rec.get("category")
    if cat is None and rec.get("slot") not in (None, "", "-"):
        return "w"
    return LOOT_TYPE.get(cat, "e")


def main():
    refresh = "--refresh" in sys.argv
    loot = js_object("loot", "LOOT")
    ids = sorted({str(i) for v in loot.values() for i, _ in v[3]}, key=int)
    sell, kind, missing = {}, {}, []
    for n, i in enumerate(ids):
        rec = item(i, refresh)
        sell[i] = rec.get("sell_price") if rec else None
        kind[i] = loot_type(rec)
        if sell[i] is None:
            missing.append(i)
        if n % 100 == 99:
            print(f"{n + 1}/{len(ids)} items", flush=True)
    with open(os.path.join(DATA, "prices.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// NPC sell price (zeny) by item id, for every item in data/loot.js (rozerodb.com /api/items: sell_price; null = rozerodb has none, and its loot value counts it as 0); written by tools/export_prices.py\n")
        f.write("const NPCSELL=" + json.dumps(sell, separators=(",", ":")) + ";\n")
    with open(os.path.join(DATA, "itemtypes.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// Auto-loot group by item id, for every item in data/loot.js (rozerodb.com /api/items: category): w weapon, a armor, u consumable, c card, e miscellaneous, o costume; written by tools/export_prices.py\n")
        f.write("const ITEMTYPE=" + json.dumps(kind, separators=(",", ":")) + ";\n")
    print(f"{len(ids) - len(missing)} of {len(ids)} items priced")
    print("auto-loot groups:", {k: list(kind.values()).count(k) for k in "wauceo"})
    if missing:
        print("no price:", " ".join(missing))

    # check: each monster's drops at these prices should give rozerodb's loot value per kill
    rows = []
    for mob, (val, priced, n, drops) in loot.items():
        calc = sum((sell.get(str(i)) or 0) * ch / 100 for i, ch in drops)
        rows.append((abs(calc - val), mob, val, calc))
    ok = sum(1 for d, *_ in rows if d <= 1)
    print(f"{ok} of {len(rows)} monsters' loot values match within 1 zeny")
    for d, mob, val, calc in sorted(rows, reverse=True)[:15]:
        if d > 1:
            print(f"  #{mob}: loot.js {val}, from prices {calc:.2f}")


if __name__ == "__main__":
    main()
