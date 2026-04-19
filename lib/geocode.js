export async function geocodeLocation(query) {
  if (!query || query.trim() === '') {
    throw new Error('Location is required')
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ronda-app/1.0',
        'Accept-Language': 'en',
      },
    })

    const data = await res.json()

    if (!data || data.length === 0) {
      console.warn(`📍 Geocoding not found for: ${query}`)
      return null
    }

    const place = data[0]

    return {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      displayName: place.display_name,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}