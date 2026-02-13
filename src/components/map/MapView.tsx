"use client";

import dynamic from "next/dynamic";
import { Venue } from "@/lib/types";

const MapViewInner = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-sm">Loading map...</span>
    </div>
  ),
});

interface MapViewProps {
  center: { lat: number; lng: number };
  venues: Venue[];
  selectedVenueId: string | null;
  onSelectVenue: (venue: Venue) => void;
}

export function MapView(props: MapViewProps) {
  return <MapViewInner {...props} />;
}
