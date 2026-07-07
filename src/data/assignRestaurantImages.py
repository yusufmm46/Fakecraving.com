"""One-time offline script. Assigns each restaurant in restaurants.json a
specific photo from its cuisine's pool (fetched by fetchCuisineImages.py),
so restaurants sharing a cuisine don't all display the same picture.

Restaurants are shuffled (seeded, so this is reproducible) before assignment
and photos are handed out round-robin from the pool -- once a cuisine's pool
is exhausted, it cycles back to the start rather than repeating the same
restaurant-photo pairing pattern every time.

Run: python src/data/assignRestaurantImages.py
(after both seedMerge.py and fetchCuisineImages.py)
"""

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESTAURANTS_PATH = ROOT / "public" / "data" / "restaurants.json"
CREDITS_PATH = ROOT / "public" / "images" / "cuisines" / "credits.json"

random.seed(20260702)


def main():
    data = json.loads(RESTAURANTS_PATH.read_text(encoding="utf-8"))
    credits = json.loads(CREDITS_PATH.read_text(encoding="utf-8"))
    restaurants = data["restaurants"]

    by_cuisine = {}
    for r in restaurants:
        by_cuisine.setdefault(r["cuisine"], []).append(r)

    unassigned_cuisines = []
    for cuisine, group in by_cuisine.items():
        pool = [entry["file"] for entry in credits.get(cuisine, [])]
        if not pool:
            unassigned_cuisines.append(cuisine)
            continue
        shuffled = group[:]
        random.shuffle(shuffled)
        for i, restaurant in enumerate(shuffled):
            restaurant["image"] = pool[i % len(pool)]

    RESTAURANTS_PATH.write_text(
        json.dumps({"restaurants": restaurants}, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    total = len(restaurants)
    pool_sizes = {c: len(v) for c, v in credits.items()}
    print(f"Assigned images to {total - sum(len(by_cuisine[c]) for c in unassigned_cuisines)}/{total} restaurants.")
    print("Pool sizes:", pool_sizes)
    if unassigned_cuisines:
        print("No pool available for:", unassigned_cuisines)


if __name__ == "__main__":
    main()
