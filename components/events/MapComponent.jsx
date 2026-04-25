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
  const containerId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    // Nettoyer la carte précédente si elle existe
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    if (!center) return

    // Initialisation de la carte avec un ID unique
    mapRef.current = L.map(containerId.current).setView(center, 15)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current)

    // Ajout du marqueur
    markerRef.current = L.marker(center)
      .addTo(mapRef.current)
      .bindPopup(location || 'Meeting point')
      .openPopup()

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
      id={containerId.current} 
      style={{ 
        height, 
        width: '100%', 
        borderRadius: 'var(--radius-md)',
        zIndex: 1 
      }} 
    />
  )
}