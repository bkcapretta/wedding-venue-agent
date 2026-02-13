import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { query, lat, lng, radiusMeters } = await req.json();

    if (!query || lat == null || lng == null || !radiusMeters) {
      return NextResponse.json(
        { error: "query, lat, lng, and radiusMeters are required" },
        { status: 400 }
      );
    }

    const venues = await searchPlaces({ query, lat, lng, radiusMeters });

    // Upsert venues into the database
    for (const venue of venues) {
      await prisma.venue.upsert({
        where: { placeId: venue.placeId },
        update: {
          name: venue.name,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
          rating: venue.rating,
          priceLevel: venue.priceLevel,
          phoneNumber: venue.phoneNumber,
          website: venue.website,
          photoRefs: venue.photoRefs,
          types: venue.types,
        },
        create: {
          placeId: venue.placeId,
          name: venue.name,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
          rating: venue.rating,
          priceLevel: venue.priceLevel,
          phoneNumber: venue.phoneNumber,
          website: venue.website,
          photoRefs: venue.photoRefs,
          types: venue.types,
        },
      });
    }

    // Record the search
    const search = await prisma.search.create({
      data: {
        query,
        lat,
        lng,
        radiusKm: radiusMeters / 1000,
        results: {
          create: venues.map((venue, index) => ({
            venueId: venue.placeId,
            rank: index + 1,
          })),
        },
      },
    });

    return NextResponse.json({ venues, searchId: search.id });
  } catch (error) {
    console.error("Venue search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
