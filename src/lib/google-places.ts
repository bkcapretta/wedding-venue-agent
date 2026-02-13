import { Venue } from "./types";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  priceLevel?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  photos?: Array<{ name: string }>;
  types?: string[];
  outdoorSeating?: boolean;
  goodForGroups?: boolean;
}

export async function searchPlaces(params: {
  query: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}): Promise<Venue[]> {
  const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.priceLevel",
        "places.photos",
        "places.types",
        "places.websiteUri",
        "places.nationalPhoneNumber",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: params.query,
      locationBias: {
        circle: {
          center: { latitude: params.lat, longitude: params.lng },
          radius: params.radiusMeters,
        },
      },
      maxResultCount: 20,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const places: GooglePlaceResult[] = data.places ?? [];

  return places.map(mapGooglePlaceToVenue);
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function mapGooglePlaceToVenue(place: GooglePlaceResult): Venue {
  return {
    id: place.id,
    placeId: place.id,
    name: place.displayName?.text ?? "Unknown Venue",
    address: place.formattedAddress ?? "",
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null,
    phoneNumber: place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    photoRefs: (place.photos ?? []).map((p) => p.name),
    types: place.types ?? [],
    capacity: null,
    description: null,
  };
}

export function getPhotoUrl(photoRef: string, maxWidth: number = 400): string {
  return `${PLACES_API_BASE}/${photoRef}/media?maxWidthPx=${maxWidth}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}
