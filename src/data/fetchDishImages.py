"""One-time (long-running) offline script. Fetches one distinct photo per
UNIQUE dish name across the whole catalog -- not per dish row -- so two
restaurants that happen to sell an identically-named item share a fetch
rather than doubling API calls.

Source priority per dish name:
  1. Foodish (foodish-api.com) -- free, no key, no rate limit, returns a
     random distinct photo per call -- if the name matches one of its ~10
     fixed categories (biryani/pizza/burger/pasta/rice/dessert/dosa/idly/
     samosa/butter-chicken).
  2. Pexels search (needs PEXELS_API_KEY) for everything else -- flexible
     query but rate-limited to 200 req/hour on the free tier.
  3. No match from either -> image_url stays null; the frontend falls back
     to the dish's themed emoji.

This is checkpointed: progress is written to dish-images-manifest.json after
every single name, so the script can be killed and re-run at any time and
will pick up where it left off (already-resolved names, including ones that
found nothing, are skipped on resume).

Run: python src/data/fetchDishImages.py
"""

import json
import re
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pexelsClient import PexelsClient  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RESTAURANTS_PATH = ROOT / "public" / "data" / "restaurants.json"
MANIFEST_PATH = ROOT / "public" / "data" / "dish-images-manifest.json"

FOODISH_BASE = "https://foodish-api.com/api/images"
FOODISH_CATEGORIES = [
    ("biryani", ["biryani", "mandi"]),
    ("butter-chicken", ["butter chicken"]),
    ("pizza", ["pizza"]),
    ("burger", ["burger"]),
    ("pasta", ["pasta"]),
    ("dosa", ["dosa"]),
    ("idly", ["idli", "idly"]),
    ("samosa", ["samosa"]),
    ("dessert", ["cake", "brownie", "pastry", "sweet", "mithai", "jamun", "rasmalai", "halwa", "barfi", "ice cream", "kulfi"]),
    ("rice", ["rice", "pulao"]),
]


def foodish_category_for(name_lower):
    for category, keywords in FOODISH_CATEGORIES:
        if any(k in name_lower for k in keywords):
            return category
    return None


def fetch_foodish(category):
    resp = requests.get(f"{FOODISH_BASE}/{category}", timeout=15)
    resp.raise_for_status()
    return resp.json()["image"]


def clean_query(name):
    # Strip bracketed/parenthetical annotations ("[8 inches]", "(Serves 2)")
    # that hurt search relevance but keep the core dish name intact.
    cleaned = re.sub(r"[\[\(].*?[\]\)]", "", name).strip()
    return cleaned or name


def load_manifest():
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {}


def save_manifest(manifest):
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    data = json.loads(RESTAURANTS_PATH.read_text(encoding="utf-8"))
    unique_names = {}
    for r in data["restaurants"]:
        for dish in r["dishes"]:
            key = dish["name"].strip().lower()
            unique_names.setdefault(key, dish["name"].strip())

    manifest = load_manifest()
    pexels = None  # lazily created only when actually needed
    todo = [n for k, n in unique_names.items() if k not in manifest]
    print(f"{len(unique_names)} unique dish names, {len(todo)} remaining to fetch")

    foodish_count = 0
    pexels_count = 0
    miss_count = 0

    for i, name in enumerate(todo, start=1):
        key = name.lower()
        category = foodish_category_for(key)
        try:
            if category:
                url = fetch_foodish(category)
                manifest[key] = {"image_url": url, "source": "foodish"}
                foodish_count += 1
                time.sleep(0.15)
            else:
                if pexels is None:
                    pexels = PexelsClient()
                result = pexels.search(f"{clean_query(name)} food")
                if result:
                    manifest[key] = {"image_url": result["image_url"], "source": "pexels", **result}
                    pexels_count += 1
                else:
                    manifest[key] = {"image_url": None, "source": None}
                    miss_count += 1
        except Exception as e:
            print(f"[ERR] {name}: {e}")
            manifest[key] = {"image_url": None, "source": None, "error": str(e)}
            miss_count += 1

        save_manifest(manifest)
        if i % 25 == 0 or i == len(todo):
            print(f"[{i}/{len(todo)}] foodish={foodish_count} pexels={pexels_count} miss={miss_count}")

    print(f"\nDone. foodish={foodish_count} pexels={pexels_count} miss={miss_count} total_resolved={len(manifest)}")


if __name__ == "__main__":
    main()
