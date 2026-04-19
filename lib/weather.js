// lib/weather.js
const WEATHER_API_KEY = 'f5be3deea1fca0cb0edb00429d3c72bf'

export async function getWeatherForLocation(lat, lng) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`
    )
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || 'Weather fetch failed')
    }
    
    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      description: data.weather[0].description,
    }
  } catch (error) {
    console.error('Weather error:', error)
    return null
  }
}