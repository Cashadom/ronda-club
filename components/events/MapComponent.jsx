'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function MapComponent({ center, location, height = '240px' }) {
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current && center) {
      // Initialisation de la carte
      mapRef.current = L.map('map-preview').setView(center, 15)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)
    }

    if (mapRef.current && center) {
      // Mise à jour de la position
      mapRef.current.setView(center, 15)
      
      if (markerRef.current) {
        markerRef.current.remove()
      }
      
      markerRef.current = L.marker(center)
        .addTo(mapRef.current)
        .bindPopup(location || 'Meeting point')
        .openPopup()
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, location])

  if (!center) return null

  return (
    <div 
      id="map-preview" 
      style={{ 
        height, 
        width: '100%', 
        borderRadius: 'var(--radius-md)',
        zIndex: 1 
      }} 
    />
  )
}