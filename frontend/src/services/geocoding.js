export async function reverseGeocode(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'json')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'FoodSpotsApp/1.0 (local-dev)',
    },
  })

  if (!response.ok) {
    throw new Error('Reverse geocoding failed')
  }

  const data = await response.json()
  const address = data.address || {}

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.municipality ||
    address.county ||
    ''

  return {
    address: address.road || address.pedestrian || address.footway || data.display_name?.split(',')[0]?.trim() || '',
    streetNumber: address.house_number || '',
    postalCode: address.postcode || '',
    city,
    country: address.country || '',
  }
}
