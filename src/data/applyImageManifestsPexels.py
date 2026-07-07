"""Merges dish-images-manifest.json and restaurant-images-manifest.json
(built by fetchDishImages.py / fetchRestaurantImagesPexels.py) into
restaurants.json, and writes a slim pexels-credits.json listing only the
photos actually in use (for attribution on the About page).

Safe to re-run at any point during the long fetch jobs -- picks up whatever
progress exists so far. Restaurant covers only get reassigned for a cuisine
once its pool is non-empty; cuisines with no fetched photos yet keep
whatever `image` value restaurants.json already had (e.g. the earlier
Commons-sourced photo) rather than being left blank.

Run: python src/data/applyImageManifestsPexels.py
"""

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESTAURANTS_PATH = ROOT / "public" / "data" / "restaurants.json"
DISH_MANIFEST_PATH = ROOT / "public" / "data" / "dish-images-manifest.json"
RESTAURANT_MANIFEST_PATH = ROOT / "public" / "data" / "restaurant-images-manifest.json"
CREDITS_PATH = ROOT / "public" / "data" / "pexels-credits.json"

random.seed(20260704)


def main():
    data = json.loads(RESTAURANTS_PATH.read_text(encoding="utf-8"))
    restaurants = data["restaurants"]

    dish_manifest = (
        json.loads(DISH_MANIFEST_PATH.read_text(encoding="utf-8")) if DISH_MANIFEST_PATH.exists() else {}
    )
    restaurant_manifest = (
        json.loads(RESTAURANT_MANIFEST_PATH.read_text(encoding="utf-8"))
        if RESTAURANT_MANIFEST_PATH.exists()
        else {}
    )

    # --- restaurant covers: shuffle + cycle-assign per cuisine pool ---
    by_cuisine = {}
    for r in restaurants:
        by_cuisine.setdefault(r["cuisine"], []).append(r)

    reassigned = 0
    for cuisine, group in by_cuisine.items():
        pool = restaurant_manifest.get(cuisine, [])
        if not pool:
            continue
        shuffled = group[:]
        random.shuffle(shuffled)
        for i, restaurant in enumerate(shuffled):
            restaurant["image"] = pool[i % len(pool)]["image_url"]
            reassigned += 1

    # --- dish images: look up by normalized name ---
    dish_image_count = 0
    dish_total = 0
    for r in restaurants:
        for dish in r["dishes"]:
            dish_total += 1
            entry = dish_manifest.get(dish["name"].strip().lower())
            if entry and entry.get("image_url"):
                dish["image_url"] = entry["image_url"]
                dish_image_count += 1
            else:
                dish["image_url"] = None

    RESTAURANTS_PATH.write_text(
        json.dumps({"restaurants": restaurants}, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # --- credits: only photos actually assigned/used ---
    pexels_credits = []
    seen_pages = set()
    for pool in restaurant_manifest.values():
        for entry in pool:
            if entry.get("pexels_page_url") and entry["pexels_page_url"] not in seen_pages:
                seen_pages.add(entry["pexels_page_url"])
                pexels_credits.append(
                    {
                        "photographer": entry["photographer"],
                        "photographer_url": entry["photographer_url"],
                        "pexels_page_url": entry["pexels_page_url"],
                    }
                )
    for entry in dish_manifest.values():
        if entry.get("source") == "pexels" and entry.get("pexels_page_url") not in seen_pages:
            seen_pages.add(entry["pexels_page_url"])
            pexels_credits.append(
                {
                    "photographer": entry["photographer"],
                    "photographer_url": entry["photographer_url"],
                    "pexels_page_url": entry["pexels_page_url"],
                }
            )
    CREDITS_PATH.write_text(json.dumps(pexels_credits, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Restaurant covers reassigned: {reassigned}/{len(restaurants)}")
    print(f"Dish images applied: {dish_image_count}/{dish_total}")
    print(f"Pexels credits written: {len(pexels_credits)} photos")


if __name__ == "__main__":
    main()
