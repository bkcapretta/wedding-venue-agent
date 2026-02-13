"use client";

import clsx from "clsx";
import { Venue } from "@/lib/types";

interface VenueCardProps {
  venue: Venue;
  isSelected: boolean;
  onSelect: (venue: Venue) => void;
}

const PRICE_LABELS = ["Free", "$", "$$", "$$$", "$$$$"];

export function VenueCard({ venue, isSelected, onSelect }: VenueCardProps) {
  return (
    <button
      onClick={() => onSelect(venue)}
      className={clsx(
        "w-full text-left p-4 rounded-xl border transition-all hover:shadow-md",
        isSelected
          ? "border-rose-400 bg-rose-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex gap-3">
        {/* Photo thumbnail */}
        {venue.photoRefs.length > 0 ? (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={`/api/photos?ref=${encodeURIComponent(venue.photoRefs[0])}&maxWidth=200`}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl text-gray-300">&#x1F3E0;</span>
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{venue.name}</h3>
          <p className="text-xs text-gray-500 truncate mt-0.5">{venue.address}</p>

          <div className="flex items-center gap-3 mt-2 text-xs">
            {venue.rating != null && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                &#9733; {venue.rating.toFixed(1)}
              </span>
            )}
            {venue.priceLevel != null && (
              <span className="text-gray-500">
                {PRICE_LABELS[venue.priceLevel] ?? ""}
              </span>
            )}
            {venue.capacity != null && (
              <span className="text-gray-500">
                Up to {venue.capacity} guests
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                Website
              </a>
            )}
            {venue.phoneNumber && (
              <a
                href={`tel:${venue.phoneNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                {venue.phoneNumber}
              </a>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
