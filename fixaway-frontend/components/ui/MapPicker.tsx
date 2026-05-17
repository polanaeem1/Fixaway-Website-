'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLocation?: { lat: number; lng: number };
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
}

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const defaultCenter = initialLocation || { lat: 25.2048, lng: 55.2708 }; // Dubai default

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-surface-container animate-pulse rounded-lg flex items-center justify-center text-on-surface-variant font-label-caps">Loading Map...</div>;

  const handleLocationSelect = (lat: number, lng: number) => {
    // Simple mock reverse geocoding
    const mockAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    onLocationSelect(lat, lng, mockAddress);
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={handleLocationSelect} />
        {initialLocation && <Marker position={[initialLocation.lat, initialLocation.lng]} icon={icon} />}
      </MapContainer>
    </div>
  );
}
