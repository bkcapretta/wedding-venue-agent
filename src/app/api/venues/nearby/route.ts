import { NextRequest, NextResponse } from "next/server";
import { findNearbyVenues, KM_PER_MILE } from "@/lib/agent/tools";
import { prisma } from "@/lib/prisma";
import { Venue } from "@/lib/types";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const placeIds = params.get("placeIds");

  // If specific placeIds are provided, fetch exactly those venues
  if (placeIds) {
    const ids = placeIds.split(",").filter(Boolean);
    const venues = await prisma.venue.findMany({
      where: { placeId: { in: ids } },
      orderBy: { rating: "desc" },
    }) as Venue[];
    return NextResponse.json(venues);
  }

  // Otherwise, fetch all venues in the search area
  const lat = parseFloat(params.get("lat") ?? "0");
  const lng = parseFloat(params.get("lng") ?? "0");
  const radiusMiles = parseFloat(params.get("radius") ?? "25");

  const venues = await findNearbyVenues(lat, lng, radiusMiles * KM_PER_MILE);
  return NextResponse.json(venues);
}
