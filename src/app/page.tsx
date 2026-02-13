"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationInput } from "@/components/landing/LocationInput";
import { RadiusSelector } from "@/components/landing/RadiusSelector";

export default function LandingPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(location)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to find location");
      }

      const params = new URLSearchParams({
        lat: data.lat.toString(),
        lng: data.lng.toString(),
        radius: radius.toString(),
        location: data.formattedAddress,
      });

      router.push(`/chat?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Find Your Venue
          </h1>
          <p className="text-gray-600 text-lg">
            Discover the perfect wedding venue — traditional or unexpected
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <LocationInput value={location} onChange={setLocation} />
          <RadiusSelector value={radius} onChange={setRadius} />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Finding venues..." : "Search Venues"}
          </button>
        </form>
      </div>
    </div>
  );
}
