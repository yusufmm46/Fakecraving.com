"""One-time offline script. Merges the Kaggle Zomato metropolitan-areas
dataset with generated fictional identity + descriptions, and writes
public/data/restaurants.json.

Source dataset: "Zomato Restaurants Dataset for Metropolitan Areas"
(narsingraogoud/zomato-restaurants-dataset-for-metropolitan-areas on Kaggle).

We keep from Kaggle: city, cuisine, price signal (item prices), rating,
real dish names + prices. We DO NOT keep real restaurant names, logos, or
addresses (trademark/ToS risk) -- those are replaced with procedurally
generated fictional names matching the cuisine style.

Run: python src/data/seedMerge.py
"""

import json
import random
import re
import uuid
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
SOURCE_CSV = ROOT / "data" / "raw" / "zomato_dataset.csv"
OUT_PATH = ROOT / "public" / "data" / "restaurants.json"

random.seed(20260702)

CITY_ALIASES = {
    "Banaswadi": "Bangalore",
    "Ulsoor": "Bangalore",
    "Magrath Road": "Bangalore",
    "Malleshwaram": "Bangalore",
}

PREFIXES = [
    "Rickshaw", "Tiffin", "Spice", "Masala", "Curry Leaf", "Tandoor",
    "Chai Point", "Dabba", "Nawabi", "Bombay", "Chennai Express", "Delhi Darbar",
    "Local", "Corner House", "Family", "Royal", "Golden", "Purple Chilli",
    "Street Side", "Zaika", "Swad", "Aroma", "Bawarchi", "Namaste",
    "Old City", "Bazaar", "Junction", "Ghar", "Adda", "Tapri",
]

NOUN_POOLS = {
    "biryani": ["Biryani House", "Biryani Point", "Deghi Biryani", "Biryani Junction"],
    "italian": ["Pizzeria", "Trattoria", "Pasta House", "Cucina"],
    "chinese": ["Wok", "Noodle Bar", "Dragon Kitchen", "Wok Express"],
    "south_indian": ["Mess", "Bhavan", "Kitchen", "Dosa Point", "Tiffin Corner"],
    "north_indian": ["Dhaba", "Bhavan", "Rasoi", "Handi", "Darbar", "Thali House"],
    "street_food": ["Chaat Corner", "Gully Eats", "Bhel House", "Thela"],
    "bakery": ["Bakery", "Mithai Ghar", "Patisserie", "Sweets"],
    "seafood": ["Coastal Kitchen", "Fish Fry Corner", "Harbour House"],
    "continental": ["Bistro", "Grill House", "Cafe", "Diner"],
    "fast_food": ["Fast Food Junction", "Quick Bites", "Snack Bar", "Corner"],
    "rolls": ["Roll Corner", "Wrap Junction", "Kathi House"],
    "bengali": ["Rannaghar", "Mishti Corner", "Bhoj Ghar"],
    "gujarati": ["Farsan House", "Thali Ghar", "Swad"],
    "beverages": ["Juice Bar", "Shake Shop", "Coffee House", "Beverage Point"],
    "generic": ["Kitchen", "Corner", "Bhavan", "House", "Kadai", "Adda"],
}

CUISINE_KEYWORDS = [
    (("biryani", "hyderabadi", "mandi"), "biryani"),
    (("pizza", "italian", "pasta"), "italian"),
    (("chinese", "sichuan", "momos", "thai", "asian", "tibetan"), "chinese"),
    (("south indian", "kerala", "dosa", "chettinad", "andhra"), "south_indian"),
    (("north indian", "punjabi", "mughlai", "awadhi", "kebab", "bbq", "tandoor"), "north_indian"),
    (("street food", "chaat"), "street_food"),
    (("bakery", "dessert", "mithai", "ice cream", "cake", "sweet"), "bakery"),
    (("seafood", "fish"), "seafood"),
    (("continental", "cafe", "salad", "european"), "continental"),
    (("burger", "fast food", "sandwich"), "fast_food"),
    (("roll", "wrap", "frankie"), "rolls"),
    (("bengali",), "bengali"),
    (("gujarati",), "gujarati"),
    (("beverages", "juice", "shake", "coffee"), "beverages"),
]

EMOJI_RULES = [
    (("chicken", "kebab", "tandoori"), "🍗"),
    (("mutton", "lamb", "kosha"), "🍖"),
    (("paneer",), "🧈"),
    (("biryani", "rice", "pulao"), "🍚"),
    (("pizza",), "🍕"),
    (("pasta", "noodle", "chowmein", "hakka"), "🍜"),
    (("momo", "dumpling", "manchurian"), "🥟"),
    (("dosa", "uttapam"), "🥞"),
    (("idli",), "🍥"),
    (("coffee",), "☕"),
    (("juice", "shake", "smoothie", "lassi"), "🥤"),
    (("cake", "brownie", "pastry"), "🍰"),
    (("sweet", "mithai", "jamun", "rasmalai", "halwa"), "🍡"),
    (("fish", "prawn", "crab", "seafood"), "🍤"),
    (("roll", "wrap", "frankie", "shawarma"), "🌯"),
    (("burger",), "🍔"),
    (("fries", "chips"), "🍟"),
    (("bread", "naan", "roti", "paratha", "kulcha"), "🫓"),
    (("soup",), "🍲"),
    (("salad",), "🥗"),
    (("thali",), "🍽️"),
]

DESCRIPTION_TEMPLATES = [
    "A house special, made fresh to order.",
    "Loved by regulars — order it once, crave it forever.",
    "Comfort food done right.",
    "Bold flavours, generous portions.",
    "Chef's pick, best enjoyed hot.",
    "A local favourite worth the (fake) wait.",
    "Rich, satisfying, and perfectly spiced.",
]
BESTSELLER_DESCRIPTIONS = [
    "Customer favourite, ordered again and again.",
    "The most-ordered dish on the menu.",
    "Certified crowd-pleaser.",
]
MUST_TRY_DESCRIPTIONS = [
    "Chef's must-try recommendation.",
    "If you order one thing here, make it this.",
]

# Keyword -> pool of dish-specific description phrases, so copy actually
# reflects what the dish is rather than a generic "customer favourite" line
# on every item. Checked in order; first keyword match wins.
KEYWORD_DESCRIPTIONS = [
    (("biryani",), [
        "Fragrant basmati rice, slow dum-cooked with whole spices.",
        "Layered rice and meat, sealed and cooked over a slow flame.",
    ]),
    (("mandi",), ["Slow-roasted over rice with a smoky, spiced aroma."]),
    (("paneer",), [
        "Soft cottage cheese cubes in a rich, spiced gravy.",
        "Cubes of paneer tossed in a bold, buttery sauce.",
    ]),
    (("chicken",), [
        "Tender chicken, marinated and cooked in-house.",
        "Char-grilled chicken with a smoky, spiced finish.",
    ]),
    (("mutton", "lamb"), ["Slow-cooked mutton, rich and deeply spiced."]),
    (("kebab", "tikka", "tandoori", "seekh"), [
        "Skewered and char-grilled over an open flame.",
        "Marinated overnight, grilled to a smoky finish.",
    ]),
    (("noodle", "chowmein", "hakka"), ["Wok-tossed noodles with crunchy vegetables and bold sauce."]),
    (("fried rice",), ["Wok-fried rice with a smoky, seasoned finish."]),
    (("momo", "dumpling"), ["Steamed dumplings served with a spicy dip."]),
    (("manchurian",), ["Crisp-fried and tossed in a tangy, spiced sauce."]),
    (("pizza",), ["Stone-baked, loaded with toppings, sliced fresh."]),
    (("pasta",), ["Al dente pasta tossed in a rich, flavourful sauce."]),
    (("dosa",), ["A crisp, thin rice crepe, griddled to order."]),
    (("idli",), ["Soft steamed rice cakes, light and fluffy."]),
    (("vada",), ["Crisp on the outside, soft within — a South Indian classic."]),
    (("uttapam",), ["A thick, savoury rice pancake topped with veggies."]),
    (("sambar",), ["A tangy, spiced lentil stew simmered with vegetables."]),
    (("coffee",), ["Freshly brewed, served hot."]),
    (("juice", "smoothie"), ["Freshly pressed, no shortcuts."]),
    (("shake", "lassi"), ["Thick, chilled, and generously topped."]),
    (("cake", "pastry", "brownie"), ["Baked fresh, rich and indulgent."]),
    (("sweet", "mithai", "jamun", "rasmalai", "halwa", "barfi"), [
        "A classic Indian sweet, made the traditional way.",
    ]),
    (("fish", "prawn", "crab", "seafood"), ["Fresh catch, cooked in a coastal-style masala."]),
    (("roll", "wrap", "frankie", "shawarma"), ["Rolled fresh with a spiced filling and chutney."]),
    (("burger",), ["A juicy patty stacked high, served with a toasted bun."]),
    (("fries", "chips"), ["Crisp, golden, and perfectly salted."]),
    (("naan", "roti", "paratha", "kulcha", "bread"), ["Baked fresh in the tandoor, served hot."]),
    (("soup",), ["A warm, comforting bowl, simmered slow."]),
    (("salad",), ["Fresh, crisp, and lightly dressed."]),
    (("thali",), ["A full spread — a little bit of everything, on one plate."]),
    (("dal",), ["Slow-simmered lentils, finished with a smoky tempering."]),
    (("combo", "platter"), ["A generous combo plate — more bang for your (fake) buck."]),
]


def keyword_description(item_name: str):
    lower = item_name.lower()
    for keywords, phrases in KEYWORD_DESCRIPTIONS:
        if any(k in lower for k in keywords):
            return random.choice(phrases)
    return None


# Dishes matching these keywords are heavy/shareable enough that a real food
# app would offer a Half/Full size choice instead of one fixed price.
VARIANT_KEYWORDS = ("biryani", "rice", "pulao", "noodle", "pasta", "thali", "combo", "platter", "curry", "mandi")
VARIANT_MIN_PRICE = 120

ADDON_POOLS = {
    "biryani": [("Raita", (25, 45)), ("Mirchi Ka Salan", (35, 55)), ("Boiled Egg", (15, 25)), ("Papad", (15, 25))],
    "north_indian": [("Raita", (25, 45)), ("Papad", (15, 25)), ("Tandoori Roti", (25, 40)), ("Green Salad", (30, 50))],
    "south_indian": [("Filter Coffee", (30, 50)), ("Coconut Chutney", (15, 25)), ("Extra Sambar", (20, 35))],
    "chinese": [("Spring Roll", (60, 100)), ("Extra Schezwan Sauce", (20, 30)), ("Manchow Soup", (80, 130))],
    "italian": [("Garlic Bread", (99, 149)), ("Extra Cheese", (40, 70)), ("Cold Drink", (40, 60))],
    "street_food": [("Extra Chutney", (15, 25)), ("Masala Papad", (30, 45)), ("Chaas", (25, 40))],
    "bakery": [("Whipped Cream", (25, 40)), ("Chocolate Sauce", (25, 40)), ("Filter Coffee", (30, 50))],
    "seafood": [("Steamed Rice", (60, 90)), ("Lemon Wedge", (10, 15)), ("Extra Sauce", (25, 40))],
    "continental": [("Garlic Bread", (99, 149)), ("Iced Tea", (60, 90)), ("Side Salad", (80, 120))],
    "fast_food": [("Extra Fries", (60, 90)), ("Cheese Dip", (30, 50)), ("Cold Drink", (40, 60)), ("Coleslaw", (40, 60))],
    "rolls": [("Extra Chutney", (15, 25)), ("Cold Drink", (40, 60)), ("Onion Salad", (20, 30))],
    "bengali": [("Mishti Doi", (40, 60)), ("Papad", (15, 25)), ("Luchi (2 pc)", (30, 50))],
    "gujarati": [("Chaas", (25, 40)), ("Papad", (15, 25)), ("Fafda", (40, 60))],
    "beverages": [("Extra Shot", (20, 35)), ("Whipped Cream", (20, 30)), ("Choco Toppings", (20, 35))],
    "generic": [("Cold Drink", (40, 60)), ("Papad", (15, 25)), ("Extra Sauce", (20, 35)), ("Green Salad", (30, 50))],
}


def make_addons(cuisine: str, count=4):
    pool = ADDON_POOLS[noun_pool_key_for(cuisine)]
    picks = random.sample(pool, min(count, len(pool)))
    return [
        {"id": str(uuid.uuid4()), "name": name, "price": random.randint(*price_range)}
        for name, price_range in picks
    ]


PRICE_RANGE_BUCKETS = [(150, "₹"), (300, "₹₹"), (500, "₹₹₹"), (float("inf"), "₹₹₹₹")]


def noun_pool_key_for(cuisine: str):
    lower = cuisine.lower()
    for keywords, pool_key in CUISINE_KEYWORDS:
        if any(k in lower for k in keywords):
            return pool_key
    return "generic"


def noun_pool_for(cuisine: str):
    return NOUN_POOLS[noun_pool_key_for(cuisine)]


def emoji_for(item_name: str):
    lower = item_name.lower()
    for keywords, emoji in EMOJI_RULES:
        if any(k in lower for k in keywords):
            return emoji
    return "🍽️"


def price_range_for(avg_price: float):
    for threshold, label in PRICE_RANGE_BUCKETS:
        if avg_price < threshold:
            return label
    return "₹₹₹₹"


def fictional_name(cuisine: str) -> str:
    return f"{random.choice(PREFIXES)} {random.choice(noun_pool_for(cuisine))}"


def clean_item_name(name: str) -> str:
    name = re.sub(r"\s+", " ", str(name)).strip()
    return name.title() if name.isupper() else name


def describe_dish(row, item_name: str) -> str:
    tag = str(row.get("Best Seller", "")).strip().upper()
    specific = keyword_description(item_name)
    if tag == "BESTSELLER" and random.random() < 0.6:
        return random.choice(BESTSELLER_DESCRIPTIONS)
    if tag == "MUST TRY" and random.random() < 0.6:
        return random.choice(MUST_TRY_DESCRIPTIONS)
    return specific or random.choice(DESCRIPTION_TEMPLATES)


def make_variants(item_name: str, full_price: float):
    lower = item_name.lower()
    if full_price < VARIANT_MIN_PRICE:
        return None
    if not any(k in lower for k in VARIANT_KEYWORDS):
        return None
    half_price = round(full_price * random.uniform(0.58, 0.68))
    return [
        {"id": str(uuid.uuid4()), "label": "Half", "price": half_price},
        {"id": str(uuid.uuid4()), "label": "Full", "price": round(full_price)},
    ]


def main():
    df = pd.read_csv(SOURCE_CSV)
    df.columns = [c.strip() for c in df.columns]
    for col in ["City", "Cuisine", "Place Name", "Restaurant Name", "Item Name"]:
        df[col] = df[col].astype(str).str.strip()
    df["City"] = df["City"].replace(CITY_ALIASES)
    df = df.dropna(subset=["Prices"])

    restaurants = []
    grouped = df.groupby(["Restaurant Name", "Place Name", "City"], sort=False)

    for (_, place, city), group in grouped:
        cuisine = str(group["Cuisine"].mode().iat[0]).strip()
        rating_series = pd.to_numeric(
            group["Delivery Rating"].combine_first(group["Dining Rating"]), errors="coerce"
        )
        rating = rating_series.mean()
        if pd.isna(rating) or rating <= 0:
            rating = round(random.uniform(3.4, 4.6), 1)
        else:
            rating = round(float(rating), 1)

        avg_price = pd.to_numeric(group["Prices"], errors="coerce").mean()
        price_range = price_range_for(avg_price if not pd.isna(avg_price) else 200)

        deduped = group.drop_duplicates(subset=["Item Name"])
        deduped = deduped.assign(
            _priority=deduped["Best Seller"].isin(["BESTSELLER", "MUST TRY"]).astype(int)
        ).sort_values("_priority", ascending=False)
        sample_n = min(len(deduped), random.randint(3, 8))
        picked = deduped.head(sample_n) if sample_n <= len(deduped) else deduped

        restaurant_id = str(uuid.uuid4())
        dishes = []
        for _, row in picked.iterrows():
            item_name = clean_item_name(row["Item Name"])
            price = pd.to_numeric(row["Prices"], errors="coerce")
            if pd.isna(price):
                continue
            full_price = round(float(price))
            dishes.append(
                {
                    "id": str(uuid.uuid4()),
                    "restaurant_id": restaurant_id,
                    "name": item_name,
                    "price": full_price,
                    "description": describe_dish(row, item_name),
                    "emoji": emoji_for(item_name),
                    "variants": make_variants(item_name, full_price),
                }
            )

        if not dishes:
            continue

        restaurants.append(
            {
                "id": restaurant_id,
                "name": fictional_name(cuisine),
                "cuisine": cuisine,
                "city": city,
                "area": str(place).strip(),
                "price_range": price_range,
                "rating": rating,
                "image_emoji": dishes[0]["emoji"],
                "fake_eta_min": random.randint(18, 55),
                "dishes": dishes,
                "add_ons": make_addons(cuisine),
            }
        )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"restaurants": restaurants}, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(restaurants)} restaurants to {OUT_PATH}")


if __name__ == "__main__":
    main()
