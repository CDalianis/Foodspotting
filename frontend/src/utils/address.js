export function formatStreetLine(address, streetNumber) {
  const street = address?.trim() || ''
  const number = streetNumber?.trim() || ''

  if (street && number) {
    return `${street} ${number}`
  }

  return street || number || ''
}

export function formatLocationLine(city, postalCode, country) {
  const parts = [city, postalCode, country].map((part) => part?.trim()).filter(Boolean)
  return parts.join(', ')
}
