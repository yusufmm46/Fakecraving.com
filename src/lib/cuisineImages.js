// Real photos are sourced per-cuisine (see src/data/fetchCuisineImages.py)
// from a pool of several unique photos, then each restaurant is assigned a
// specific one from its cuisine's pool (see src/data/assignRestaurantImages.py)
// so restaurants sharing a cuisine don't all display the same picture.
function fallbackCuisineImagePath(cuisine) {
  const slug = cuisine
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `/images/cuisines/${slug}-1.jpg`;
}

// restaurant.image is set by assignRestaurantImages.py for every restaurant
// whose cuisine had at least one fetched photo. Fall back to the first pool
// image for that cuisine slug in case a restaurant predates that step.
export function getRestaurantImage(restaurant) {
  return restaurant.image || fallbackCuisineImagePath(restaurant.cuisine);
}
