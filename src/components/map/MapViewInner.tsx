"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Venue } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapViewInnerProps {
  center: { lat: number; lng: number };
  venues: Venue[];
  selectedVenueId: string | null;
  onSelectVenue: (venue: Venue) => void;
}

function FlyToSelected({ venue }: { venue: Venue | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (venue) {
      map.flyTo([venue.lat, venue.lng], 15, { duration: 0.5 });
    }
  }, [venue, map]);
  return null;
}

export default function MapViewInner({
  center,
  venues,
  selectedVenueId,
  onSelectVenue,
}: MapViewInnerProps) {
  const selectedVenue = venues.find((v) => v.placeId === selectedVenueId);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected venue={selectedVenue} />
      {venues.map((venue) => (
        <Marker
          key={venue.placeId}
          position={[venue.lat, venue.lng]}
          eventHandlers={{
            click: () => onSelectVenue(venue),
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{venue.name}</strong>
              {venue.rating != null && (
                <span className="ml-1 text-amber-600">
                  &#9733; {venue.rating.toFixed(1)}
                </span>
              )}
              <br />
              <span className="text-gray-500 text-xs">{venue.address}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
