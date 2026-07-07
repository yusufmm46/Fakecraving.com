"""One-time offline script. Downloads a POOL of freely-licensed food photos
per cuisine (from Wikimedia Commons, which requires every hosted file to
carry a free/open license) and writes public/images/cuisines/.

We photo real dishes at the CUISINE level, not per fictional menu item --
there's no real photo that corresponds to a procedurally-generated dish name
tied to a fictional restaurant, so per-dish matching would be meaningless.
Instead assignRestaurantImages.py hands each restaurant a distinct photo
from its cuisine's pool, so restaurants sharing a cuisine don't all show the
exact same picture.

Every downloaded image's license/author is recorded in credits.json so the
app can show attribution where the license requires it (CC-BY / CC-BY-SA).

Run: python src/data/fetchCuisineImages.py
"""

import json
import re
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "images" / "cuisines"
CREDITS_PATH = OUT_DIR / "credits.json"
RESTAURANTS_PATH = ROOT / "public" / "data" / "restaurants.json"

USER_AGENT = "FakeCraving-app/1.0 (contact: yusufmakandar46@gmail.com)"
API_URL = "https://commons.wikimedia.org/w/api.php"
POOL_CAP = 30  # max unique photos fetched for any single cuisine

ACCEPTABLE_LICENSES = {
    "CC0",
    "Public domain",
    "PD",
    "CC BY 1.0", "CC BY 2.0", "CC BY 2.5", "CC BY 3.0", "CC BY 4.0",
    "CC BY-SA 1.0", "CC BY-SA 2.0", "CC BY-SA 2.5", "CC BY-SA 3.0", "CC BY-SA 4.0",
}

# cuisine (exact string as it appears in restaurants.json) -> list of Commons
# search queries. Multiple queries per cuisine widen the candidate pool for
# cuisines with many restaurants; single-query lists are fine for rare ones.
SEARCH_TERMS = {
    "Beverages": ["iced beverage glass drink", "cold drink glass table", "refreshing drink glass ice", "soft drink bottle glass"],
    "Pizza": ["pizza slice", "pizza whole pie", "pepperoni pizza", "vegetable pizza"],
    "Fast Food": ["burger and fries", "fast food combo meal", "cheeseburger fries", "chicken burger meal"],
    "Desserts": ["indian dessert sweet", "dessert plate", "cake dessert slice", "pudding dessert bowl"],
    "Biryani": ["biryani rice dish", "chicken biryani plate", "mutton biryani rice", "veg biryani rice bowl"],
    "Chinese": ["chinese noodles stir fry", "chinese fried rice plate", "chinese food plate", "dim sum plate"],
    "North Indian": ["north indian curry thali", "butter chicken curry", "paneer curry dish", "indian curry naan plate"],
    "Sichuan": ["sichuan spicy noodles", "sichuan food plate", "spicy chinese noodles bowl", "mapo tofu"],
    "Shake": ["milkshake glass", "chocolate milkshake", "strawberry shake glass"],
    "Street Food": ["indian street food chaat", "pani puri street food", "bhel puri chaat"],
    "South Indian": ["dosa south indian food", "idli sambar plate", "south indian thali"],
    "Rolls": ["kathi roll wrap food", "spring roll snack food", "indian roll wrap plate"],
    "Kebab": ["kebab skewer grilled", "seekh kebab plate"],
    "Ice Cream": ["ice cream scoop bowl", "ice cream sundae"],
    "Bakery": ["bakery bread pastries", "fresh baked bread"],
    "Mughlai": ["mughlai curry indian", "chicken korma"],
    "Seafood": ["seafood curry fish", "fried fish plate"],
    "Burger": ["cheeseburger", "beef burger plate"],
    "Momos": ["momos dumplings steamed", "fried momos plate"],
    "Sandwich": ["sandwich food", "club sandwich plate"],
    "Kerala": ["kerala sadya food", "kerala fish curry"],
    "BBQ": ["barbecue grilled meat", "bbq platter"],
    "Juices": ["fresh fruit juice glass", "orange juice glass"],
    "Gujarati": ["gujarati thali food", "dhokla plate"],
    "Mandi": ["chicken mandi rice", "arabian mandi platter"],
    "Hyderabadi": ["hyderabadi biryani", "hyderabadi dum biryani"],
    "Salad": ["fresh salad bowl", "vegetable salad plate"],
    "American": ["american diner burger", "american diner breakfast"],
    "Maharashtrian": ["vada pav maharashtrian", "misal pav"],
    "Pasta": ["pasta plate italian", "spaghetti plate"],
    "Wraps": ["food wrap tortilla", "chicken wrap plate"],
    "Coffee": ["coffee cup latte", "cappuccino cup"],
    "Shawarma": ["shawarma wrap", "chicken shawarma plate"],
    "Italian": ["italian pasta dish", "italian risotto plate"],
    "Continental": ["continental plated food", "grilled chicken plate"],
    "Mexican": ["tacos mexican food", "burrito plate"],
    "Rajasthani": ["rajasthani thali food"],
    "Mithai": ["indian mithai sweets"],
    "Kathiyawadi": ["gujarati kathiyawadi food"],
    "Turkish": ["turkish kebab food"],
    "Lucknowi": ["galouti kebab", "kebab plate indian"],
    "Healthy Food": ["healthy bowl vegetables"],
    "Tibetan": ["tibetan momos food"],
    "Thai": ["thai curry food"],
    "Vietnamese": ["pho vietnamese soup"],
    "Andhra": ["south indian meal banana leaf"],
    "Awadhi": ["mutton biryani plate", "awadhi kebab"],
    "Tea": ["cup of tea"],
}


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def search_candidates(term, limit=25):
    params = {
        "action": "query",
        "generator": "search",
        "gsrnamespace": 6,
        "gsrsearch": f"filetype:bitmap {term}",
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": 1200,
        "format": "json",
    }
    resp = requests.get(API_URL, params=params, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    pages = resp.json().get("query", {}).get("pages", {})
    return list(pages.values())


def acceptable_candidates(pages):
    out = []
    for page in pages:
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if info.get("width", 0) < 500 or info.get("height", 0) < 400:
            continue
        meta = info.get("extmetadata", {})
        license_name = meta.get("LicenseShortName", {}).get("value", "")
        if license_name not in ACCEPTABLE_LICENSES:
            continue
        artist_html = meta.get("Artist", {}).get("value", "Unknown")
        artist = re.sub(r"<[^>]+>", "", artist_html).strip() or "Unknown"
        out.append({
            "title": page.get("title", ""),
            "thumburl": info.get("thumburl") or info.get("url"),
            "descriptionurl": info.get("descriptionurl", ""),
            "license": license_name,
            "artist": artist,
        })
    return out


def download_and_compress(url, out_path, max_width=900, quality=82):
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()
    img = Image.open(BytesIO(resp.content)).convert("RGB")
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)
    img.save(out_path, "JPEG", quality=quality, optimize=True)


def cuisine_targets():
    """cuisine -> how many unique photos we actually want, based on how many
    restaurants of that cuisine exist (capped at POOL_CAP)."""
    if not RESTAURANTS_PATH.exists():
        return {c: POOL_CAP for c in SEARCH_TERMS}
    data = json.loads(RESTAURANTS_PATH.read_text(encoding="utf-8"))
    counts = {}
    for r in data["restaurants"]:
        counts[r["cuisine"]] = counts.get(r["cuisine"], 0) + 1
    return {c: min(counts.get(c, 1), POOL_CAP) for c in SEARCH_TERMS}


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = cuisine_targets()
    credits = {}
    total_fetched = 0

    for cuisine, terms in SEARCH_TERMS.items():
        target = targets[cuisine]
        slug = slugify(cuisine)
        seen_titles = set()
        pool = []

        for term in terms:
            if len(pool) >= target:
                break
            try:
                candidates = acceptable_candidates(search_candidates(term))
            except Exception as e:
                print(f"[ERR]  {cuisine} / '{term}': {e}")
                continue
            for c in candidates:
                if c["title"] in seen_titles:
                    continue
                seen_titles.add(c["title"])
                pool.append(c)
                if len(pool) >= target:
                    break
            time.sleep(0.2)

        entries = []
        for i, cand in enumerate(pool, start=1):
            out_path = OUT_DIR / f"{slug}-{i}.jpg"
            try:
                download_and_compress(cand["thumburl"], out_path)
            except Exception as e:
                print(f"[ERR]  {cuisine} #{i}: {e}")
                continue
            entries.append({
                "file": f"/images/cuisines/{slug}-{i}.jpg",
                "title": cand["title"],
                "artist": cand["artist"],
                "license": cand["license"],
                "source": cand["descriptionurl"],
            })
            time.sleep(0.15)

        credits[cuisine] = entries
        total_fetched += len(entries)
        print(f"[{cuisine}] target={target} got={len(entries)}")

    with open(CREDITS_PATH, "w", encoding="utf-8") as f:
        json.dump(credits, f, indent=2, ensure_ascii=False)

    short = [c for c, entries in credits.items() if len(entries) < targets[c]]
    print(f"\nDone. {total_fetched} images fetched across {len(credits)} cuisines.")
    if short:
        print("Below target:", ", ".join(f"{c} ({len(credits[c])}/{targets[c]})" for c in short))


if __name__ == "__main__":
    main()
