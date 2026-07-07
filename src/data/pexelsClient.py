"""Small rate-limit-aware Pexels API client shared by the image-fetch
scripts. Free tier: 200 requests/hour, 20,000/month. Reads X-Ratelimit-*
response headers and sleeps until the window resets rather than guessing,
so we use the full budget without ever tripping the limit.
"""

import os
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
SEARCH_URL = "https://api.pexels.com/v1/search"


def _load_env_key():
    key = os.environ.get("PEXELS_API_KEY")
    if key:
        return key
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("PEXELS_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("PEXELS_API_KEY not found in environment or .env")


class PexelsClient:
    def __init__(self):
        self.api_key = _load_env_key()
        self.remaining = None
        self.reset_at = None

    def _throttle(self):
        # The X-Ratelimit-Reset header reflects the MONTHLY window (can be
        # weeks away) -- it's only meaningful when remaining is genuinely
        # near zero, never as a short-term retry delay (see search()'s 429
        # handling, which deliberately does NOT use this value).
        if self.remaining is not None and self.remaining <= 1 and self.reset_at:
            wait = max(0, self.reset_at - time.time()) + 2
            if wait > 0:
                print(f"[pexels] monthly quota exhausted, sleeping {wait:.0f}s")
                time.sleep(wait)
        time.sleep(4.0)  # conservative pacing -- there's an undocumented short-window throttle

    def search(self, query, page=1, per_page=1, _retries=0):
        self._throttle()
        resp = requests.get(
            SEARCH_URL,
            params={"query": query, "page": page, "per_page": per_page},
            headers={"Authorization": self.api_key, "User-Agent": "FakeCraving/1.0"},
            timeout=20,
        )
        remaining = resp.headers.get("X-Ratelimit-Remaining")
        reset = resp.headers.get("X-Ratelimit-Reset")
        if remaining is not None:
            self.remaining = int(remaining)
        if reset is not None:
            self.reset_at = int(reset)

        if resp.status_code == 429:
            if _retries >= 5:
                raise RuntimeError(f"Pexels still 429 after {_retries} retries on: {query!r}")
            # Short, fixed backoff -- NOT the monthly reset timestamp.
            wait = 30 * (_retries + 1)
            print(f"[pexels] got 429 (retry {_retries + 1}/5), backing off {wait}s")
            time.sleep(wait)
            return self.search(query, page=page, per_page=per_page, _retries=_retries + 1)

        resp.raise_for_status()
        data = resp.json()
        photos = data.get("photos", [])
        if not photos:
            return None
        p = photos[0]
        return {
            "image_url": p["src"]["medium"],
            "photographer": p["photographer"],
            "photographer_url": p["photographer_url"],
            "pexels_page_url": p["url"],
        }
