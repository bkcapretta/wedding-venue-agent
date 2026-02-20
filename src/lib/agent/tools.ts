import { tool } from "ai";
import { z } from "zod";
import { searchPlaces } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { Venue, SearchContext } from "@/lib/types";

export const KM_PER_MILE = 1.60934;
const KM_PER_DEG_LAT = 111.32;
const MAX_VENUES = 20;

/** Slim venue summary for Claude — strips photoRefs, types, lat/lng, etc. */
function summarizeVenue(v: Venue) {
  return {
    placeId: v.placeId,
    name: v.name,
    rating: v.rating,
    priceLevel: v.priceLevel,
    website: v.website,
  };
}

/** Find cached venues within a bounding box approximation of the search radius. */
export async function findNearbyVenues(lat: number, lng: number, radiusKm: number): Promise<Venue[]> {
  const dLat = radiusKm / KM_PER_DEG_LAT;
  const dLng = radiusKm / (KM_PER_DEG_LAT * Math.cos(lat * (Math.PI / 180)));

  return prisma.venue.findMany({
    where: {
      lat: { gte: lat - dLat, lte: lat + dLat },
      lng: { gte: lng - dLng, lte: lng + dLng },
    },
    orderBy: { rating: "desc" },
    take: MAX_VENUES,
  }) as Promise<Venue[]>;
}

export function createTools(context?: SearchContext) {
  return {
    searchVenues: tool({
      description:
        "Search for wedding venues near a location using Google Places. This is the PRIMARY tool for refining results " +
        "based on user preferences. Google understands natural language queries, so include the user's specific desires " +
        "directly in the query. " +
        'Examples: "wedding venues for 100 guests", "outdoor ceremony indoor reception venue", ' +
        '"vineyard wedding with catering", "rooftop event space with views".',
      inputSchema: z.object({
        query: z.string().describe("Search query for the type of venue to find"),
        radius: z
          .number()
          .optional()
          .describe("Default search radius in miles"),
      }),
      execute: async ({ query, radius }): Promise<{ summary: ReturnType<typeof summarizeVenue>[]; count: number }> => {
        const radiusMiles = radius ?? context?.radius ?? 25;
        const radiusKm = radiusMiles * KM_PER_MILE;
        const lat = context?.lat ?? 0;
        const lng = context?.lng ?? 0;

        try {
          // Check Postgres cache first — find venues within the search radius
          const cached = await findNearbyVenues(lat, lng, radiusKm);

          if (cached.length > 0) {
            return { summary: cached.map(summarizeVenue), count: cached.length };
          }

          // Cache miss — call Google Places and store results
          const venues = await searchPlaces({
            query,
            lat,
            lng,
            radiusMeters: radiusKm * 1000,
          });

          for (const venue of venues) {
            await prisma.venue.upsert({
              where: { placeId: venue.placeId },
              update: venue,
              create: venue,
            });
          }

          return { summary: venues.map(summarizeVenue), count: venues.length };
        } catch (error) {
          return { summary: [], count: 0 };
        }
      },
    }),
    filterVenues: tool({
      description:
        "Filter venues in the current search area by using structured criteria defined " +
        "by the user. Use this to narrow down the current list of results without calling " + 
        "Google Places again.",
      inputSchema: z.object({
        minRating: z
          .number()
          .optional()
          .describe("Minimum Google rating (1-5)"),
        maxPriceLevel: z
          .number()
          .optional()
          .describe("Maximum price level (0-4, where 4 is most expensive)"),
        minCapacity: z
          .number()
          .optional()
          .describe("Minimum guest capacity"),
        venueTypes: z
          .array(z.string())
          .optional()
          .describe('Venue type keywords to match, e.g. ["barn", "vineyard", "rooftop"]'),
        nameOrDescription: z
          .string()
          .optional()
          .describe("Search term to match against venue name or description"),
      }),
      execute: async ({
        minRating,
        maxPriceLevel,
        minCapacity,
        venueTypes,
        nameOrDescription,
      }): Promise<{ summary: ReturnType<typeof summarizeVenue>[]; count: number }> => {
        try {
          const radiusKm = (context?.radius ?? 25) * KM_PER_MILE;
          const lat = context?.lat ?? 0;
          const lng = context?.lng ?? 0;

          // Start with venues in the current search area
          let venues = await findNearbyVenues(lat, lng, radiusKm);

          // Apply structured filters in-memory (null = unknown, so keep the venue)
          if (minRating != null) venues = venues.filter((v) => v.rating == null || v.rating >= minRating);
          if (maxPriceLevel != null) venues = venues.filter((v) => v.priceLevel == null || v.priceLevel <= maxPriceLevel);
          if (minCapacity != null) venues = venues.filter((v) => v.capacity == null || v.capacity >= minCapacity);
          if (venueTypes?.length) {
            venues = venues.filter((v) =>
              venueTypes.some((t) => v.types.some((vt) => vt.toLowerCase().includes(t.toLowerCase())))
            );
          }
          if (nameOrDescription) {
            const term = nameOrDescription.toLowerCase();
            venues = venues.filter((v) =>
              v.name.toLowerCase().includes(term) ||
              (v.description?.toLowerCase().includes(term) ?? false)
            );
          }

          return { summary: venues.map(summarizeVenue), count: venues.length };
        } catch (error) {
          return { summary: [], count: 0 };
        }
      },
    }),

    getVenueDetails: tool({
      description:
        "Get detailed information about a specific venue by its name, ID, or place ID.",
      inputSchema: z.object({
        venueId: z.string().describe("The venue ID or Google Place ID to look up"),
      }),
      execute: async ({ venueId }): Promise<{ summary: ReturnType<typeof summarizeVenue> | null }> => {
        try {
          const venue = await prisma.venue.findFirst({
            where: { OR: [{ id: venueId }, { placeId: venueId }] },
          }) as Venue | null;

          return { summary: venue ? summarizeVenue(venue) : null };
        } catch {
          return { summary: null };
        }
      },
    }),
  };
}
