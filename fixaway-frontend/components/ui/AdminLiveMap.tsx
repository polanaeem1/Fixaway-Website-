'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Setup custom Leaflet marker icons using colored images
const activeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const onJobIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface TechnicianMarker {
  id: string;
  name: string;
  specialty: string;
  status: string;
  lat: number;
  lng: number;
}

interface AdminLiveMapProps {
  technicians: TechnicianMarker[];
}

export default function AdminLiveMap({ technicians }: AdminLiveMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-surface-container flex items-center justify-center animate-pulse">
        <span className="text-on-surface-variant text-sm font-semibold">Loading Map...</span>
      </div>
    );
  }

  // Default center to Cairo
  const defaultCenter: [number, number] = [30.0444, 31.2357];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {technicians
          .filter(t => t.lat && t.lng)
          .map(t => (
            <Marker 
              key={t.id} 
              position={[t.lat, t.lng]} 
              icon={t.status === 'On Job' ? onJobIcon : activeIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-primary text-sm m-0">{t.name}</p>
                  <p className="text-xs text-on-surface-variant m-0">{t.specialty}</p>
                  <span className={`text-xs font-bold mt-1 block ${t.status === 'On Job' ? 'text-secondary' : 'text-green-600'}`}>
                    {t.status}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
