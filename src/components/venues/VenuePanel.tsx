"use client";

import { useState } from "react";
import { Venue } from "@/lib/types";
import { MapView } from "@/components/map/MapView";
import { VenueList } from "./VenueList";

interface VenuePanelProps {
  venues: Venue[];
  center: { lat: number; lng: number };
}

export function VenuePanel({ venues, center }: VenuePanelProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenueId((prev) =>
      prev === venue.placeId ? null : venue.placeId
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map - top 40% */}
      <div className="h-[40%] border-b border-gray-200">
        <MapView
          center={center}
          venues={venues}
          selectedVenueId={selectedVenueId}
          onSelectVenue={handleSelectVenue}
        />
      </div>

      {/* Venue list - bottom 60% */}
      <div className="h-[60%] overflow-hidden">
        <VenueList
          venues={venues}
          selectedVenueId={selectedVenueId}
          onSelectVenue={handleSelectVenue}
        />
      </div>
    </div>
  );
}
