"use client";

import { Venue } from "@/lib/types";
import { VenueCard } from "./VenueCard";

interface VenueListProps {
  venues: Venue[];
  selectedVenueId: string | null;
  onSelectVenue: (venue: Venue) => void;
}

export function VenueList({ venues, selectedVenueId, onSelectVenue }: VenueListProps) {
  if (venues.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8">
        <p>Venues will appear here as the assistant finds them</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-3 space-y-2">
      <p className="text-xs text-gray-500 px-1 mb-2">
        {venues.length} venue{venues.length !== 1 ? "s" : ""} found
      </p>
      {venues.map((venue) => (
        <VenueCard
          key={venue.placeId}
          venue={venue}
          isSelected={selectedVenueId === venue.placeId}
          onSelect={onSelectVenue}
        />
      ))}
    </div>
  );
}
