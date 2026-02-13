import { NextRequest, NextResponse } from "next/server";
import { getPhotoUrl } from "@/lib/google-places";

export async function GET(req: NextRequest) {
  const photoRef = req.nextUrl.searchParams.get("ref");
  const maxWidth = parseInt(req.nextUrl.searchParams.get("maxWidth") ?? "400", 10);

  if (!photoRef) {
    return NextResponse.json({ error: "ref parameter is required" }, { status: 400 });
  }

  try {
    const url = getPhotoUrl(photoRef, maxWidth);
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch photo" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}
