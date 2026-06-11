export const PLACE_TAGS = [
  { id: 'BURGER_STORE', label: 'Burger Store', emoji: '🍔', pinClass: 'tag-burger' },
  { id: 'SOUVLAKI', label: 'Souvlaki', emoji: '🥙', pinClass: 'tag-souvlaki' },
  { id: 'PIZZA', label: 'Pizza', emoji: '🍕', pinClass: 'tag-pizza' },
  { id: 'MEXICAN', label: 'Mexican', emoji: '🌮', pinClass: 'tag-mexican' },
  { id: 'ETHNIC', label: 'Ethnic', emoji: '🍛', pinClass: 'tag-ethnic' },
  { id: 'CANTEEN', label: 'Canteen', emoji: '🍽️', pinClass: 'tag-canteen' },
  { id: 'CAFE', label: 'Cafe', emoji: '☕', pinClass: 'tag-cafe' },
  { id: 'ASIAN', label: 'Asian', emoji: '🍜', pinClass: 'tag-asian' },
  { id: 'SEAFOOD', label: 'Seafood', emoji: '🦐', pinClass: 'tag-seafood' },
  { id: 'OTHER', label: 'Other', emoji: '📍', pinClass: 'tag-other' },
]

export const PLACE_TAG_BY_ID = Object.fromEntries(PLACE_TAGS.map((tag) => [tag.id, tag]))

export function getPrimaryTagId(tags = []) {
  return tags?.[0] || 'OTHER'
}

export function getTagMeta(tagId) {
  return PLACE_TAG_BY_ID[tagId] || PLACE_TAG_BY_ID.OTHER
}

export function formatTagLabels(tags = []) {
  return tags.map((id) => getTagMeta(id).label).join(', ')
}
