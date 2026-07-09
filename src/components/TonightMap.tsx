import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Users } from 'lucide-react'
import { distanceKm, formatDistance, type MapVenue } from '../lib/map'
import { Button } from './Button'
import 'leaflet/dist/leaflet.css'

function MapResizer({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
    setTimeout(() => map.invalidateSize(), 100)
  }, [center, map])
  return null
}

function createVenueIcon(count: number) {
  return L.divIcon({
    className: 'tonight-marker',
    html: `<div class="tonight-marker-pin"><span>${count}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  })
}

interface TonightMapProps {
  venues: MapVenue[]
  userLocation: { lat: number; lng: number } | null
  onSelectVenue: (venue: MapVenue) => void
}

export function TonightMap({ venues, userLocation, onSelectVenue }: TonightMapProps) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : venues[0]
      ? [Number(venues[0].latitude), Number(venues[0].longitude)]
      : [25.7617, -80.1918]

  return (
    <div className="tonight-map-wrap relative z-0 isolate h-[min(52vh,420px)] w-full overflow-hidden rounded-2xl border border-tonight-border">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <MapResizer center={center} />
        {venues.map((v) => {
          const lat = Number(v.latitude)
          const lng = Number(v.longitude)
          const dist =
            userLocation != null
              ? distanceKm(userLocation.lat, userLocation.lng, lat, lng)
              : null

          return (
            <Marker
              key={v.venue_id}
              position={[lat, lng]}
              icon={createVenueIcon(v.open_count)}
              eventHandlers={{ click: () => onSelectVenue(v) }}
            >
              <Popup className="tonight-popup">
                <div className="text-tonight-bg p-1 min-w-[160px]">
                  <p className="font-semibold text-sm">{v.venue_name}</p>
                  <p className="text-xs capitalize opacity-80">{v.venue_type.replace('_', ' ')}</p>
                  <p className="text-xs mt-1 flex items-center gap-1">
                    <Users size={12} /> {v.open_count} open tonight
                  </p>
                  {dist != null && (
                    <p className="text-xs mt-0.5 opacity-70">{formatDistance(dist)}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {venues.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-tonight-bg/60 p-6 text-center">
          <div>
            <MapPin className="mx-auto mb-2 text-tonight-muted" size={28} />
            <p className="text-sm text-tonight-muted">No active venues on the map yet.</p>
            <p className="mt-1 text-xs text-tonight-muted">Turn on Tonight Mode to be the first.</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface VenueMapSheetProps {
  venue: MapVenue | null
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

export function VenueMapSheet({ venue, userLocation, onClose }: VenueMapSheetProps) {
  if (!venue) return null

  const dist =
    userLocation != null
      ? distanceKm(
          userLocation.lat,
          userLocation.lng,
          Number(venue.latitude),
          Number(venue.longitude)
        )
      : null

  return (
    <div className="fixed inset-x-0 bottom-[var(--nav-total-height)] z-[150] px-4 pb-3">
      <div className="mx-auto max-w-lg rounded-2xl border border-tonight-border bg-tonight-card p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{venue.venue_name}</p>
            <p className="text-xs text-tonight-muted capitalize mt-0.5">
              {venue.venue_type.replace('_', ' ')}
              {dist != null && ` · ${formatDistance(dist)}`}
            </p>
            {venue.address && (
              <p className="text-xs text-tonight-muted mt-1 line-clamp-2">{venue.address}</p>
            )}
            <p className="text-sm text-tonight-accent mt-2 font-medium">
              {venue.open_count} {venue.open_count === 1 ? 'person' : 'people'} open tonight
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-tonight-muted hover:bg-tonight-border min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <Link to={`/venue/${venue.venue_id}`} className="block mt-4">
          <Button fullWidth>View profiles</Button>
        </Link>
      </div>
    </div>
  )
}
