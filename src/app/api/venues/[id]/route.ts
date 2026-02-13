import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const venue = await prisma.venue.findFirst({
      where: {
        OR: [{ id }, { placeId: id }],
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Venue detail error:", error);
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
  }
}
