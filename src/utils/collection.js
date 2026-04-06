const COLLECTION_KEY = 'lego_collection';
const WISHLIST_KEY = 'lego_wishlist';

function getList(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

export function getCollection() {
  return getList(COLLECTION_KEY);
}

export function addToCollection(set) {
  const collection = getCollection();
  if (!collection.find((item) => item.set_num === set.set_num)) {
    collection.push({
      set_num: set.set_num,
      name: set.name,
      year: set.year,
      num_parts: set.num_parts,
      set_img_url: set.set_img_url,
      theme_id: set.theme_id,
      added_at: new Date().toISOString(),
    });
    saveList(COLLECTION_KEY, collection);
  }
  return collection;
}

export function removeFromCollection(setNum) {
  const collection = getCollection().filter((item) => item.set_num !== setNum);
  saveList(COLLECTION_KEY, collection);
  return collection;
}

export function isInCollection(setNum) {
  return getCollection().some((item) => item.set_num === setNum);
}

export function getWishlist() {
  return getList(WISHLIST_KEY);
}

export function addToWishlist(set) {
  const wishlist = getWishlist();
  if (!wishlist.find((item) => item.set_num === set.set_num)) {
    wishlist.push({
      set_num: set.set_num,
      name: set.name,
      year: set.year,
      num_parts: set.num_parts,
      set_img_url: set.set_img_url,
      theme_id: set.theme_id,
      added_at: new Date().toISOString(),
    });
    saveList(WISHLIST_KEY, wishlist);
  }
  return wishlist;
}

export function removeFromWishlist(setNum) {
  const wishlist = getWishlist().filter((item) => item.set_num !== setNum);
  saveList(WISHLIST_KEY, wishlist);
  return wishlist;
}

export function isInWishlist(setNum) {
  return getWishlist().some((item) => item.set_num === setNum);
}
