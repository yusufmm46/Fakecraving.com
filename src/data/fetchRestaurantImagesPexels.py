"""One-time (long-running) offline script. Fetches a POOL of Pexels photos
per cuisine for restaurant cover images -- using pagination so restaurants
sharing a cuisine get different photos, not the same top search result
repeated (assignRestaurantImagesPexels.py hands each restaurant a distinct
one from its cuisine's pool, same pattern as the earlier Commons-based
approach).

Checkpointed: writes restaurant-images-manifest.json after every fetch, so
it's safe to kill and re-run -- already-fetched (cuisine, page) pairs are
skipped on resume.

Run: python src/data/fetchRestaurantImagesPexels.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pexelsClient import PexelsClient  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RESTAURANTS_PATH = ROOT / "public" / "data" / "restaurants.json"
MANIFEST_PATH = ROOT / "public" / "data" / "restaurant-images-manifest.json"
POOL_CAP = 30


def load_manifest():
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {}


def save_manifest(manifest):
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    data = json.loads(RESTAURANTS_PATH.read_text(encoding="utf-8"))
    counts = Counter(r["cuisine"] for r in data["restaurants"])
    targets = {c: min(n, POOL_CAP) for c, n in counts.items()}

    manifest = load_manifest()
    pexels = PexelsClient()

    total_needed = sum(max(0, targets[c] - len(manifest.get(c, []))) for c in targets)
    print(f"{len(targets)} cuisines, {total_needed} photos still needed")
    done = 0

    for cuisine, target in targets.items():
        pool = manifest.setdefault(cuisine, [])
        query = f"{cuisine} food restaurant"
        page = len(pool) + 1
        while len(pool) < target:
            try:
                result = pexels.search(query, page=page, per_page=1)
            except Exception as e:
                print(f"[ERR] {cuisine} page {page}: {e}")
                break
            if not result:
                print(f"[{cuisine}] ran out of results at page {page} ({len(pool)}/{target})")
                break
            pool.append(result)
            save_manifest(manifest)
            done += 1
            page += 1
            if done % 10 == 0:
                print(f"progress: {done}/{total_needed} total photos fetched")
        print(f"[{cuisine}] {len(pool)}/{target}")

    print(f"\nDone. {done} new photos fetched across {len(targets)} cuisines.")


if __name__ == "__main__":
    main()
