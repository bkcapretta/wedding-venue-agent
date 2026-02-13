import { tool } from "ai";
import { z } from "zod";
import { searchPlaces } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { Venue } from "@/lib/types";

interface SearchContext {
  lat: number;
  lng: number;
  radiusKm: number;
  location: string;
}

export function createTools(context?: SearchContext) {
  return {
    searchVenues: tool({
      description:
        "Search for wedding venues, event spaces, or other venue types near a location. " +
        "Use different queries to find traditional and non-traditional venues. " +
        'Examples: "wedding venues", "barns for events", "vineyard wedding", "rooftop event space", ' +
        '"restaurant private dining", "art gallery event rental", "brewery wedding".',
      inputSchema: z.object({
        query: z.string().describe("Search query for the type of venue to find"),
        radiusKm: z
          .number()
          .optional()
          .describe("Override the default search radius in kilometers"),
      }),
      execute: async ({ query, radiusKm }): Promise<{ venues: Venue[]; count: number }> => {
        const radius = radiusKm ?? context?.radiusKm ?? 25;
        const lat = context?.lat ?? 0;
        const lng = context?.lng ?? 0;

        try {
          const venues = await searchPlaces({
            query,
            lat,
            lng,
            radiusMeters: radius * 1000,
          });

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

          return { venues, count: venues.length };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Search failed";
          return { venues: [], count: 0 };
        }
      },
    }),

    filterVenues: tool({
      description:
        "Filter previously found venues by various criteria. Returns a filtered subset from the database.",
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
      }): Promise<{ venues: Venue[]; count: number }> => {
        try {
          const where: Record<string, unknown> = {};

          if (minRating != null) {
            where.rating = { gte: minRating };
          }
          if (maxPriceLevel != null) {
            where.priceLevel = { lte: maxPriceLevel };
          }
          if (minCapacity != null) {
            where.capacity = { gte: minCapacity };
          }
          if (nameOrDescription) {
            where.OR = [
              { name: { contains: nameOrDescription, mode: "insensitive" } },
              { description: { contains: nameOrDescription, mode: "insensitive" } },
            ];
          }
          if (venueTypes && venueTypes.length > 0) {
            where.types = { hasSome: venueTypes };
          }

          const dbVenues = await prisma.venue.findMany({ where });

          const venues: Venue[] = dbVenues.map((v) => ({
            id: v.id,
            placeId: v.placeId,
            name: v.name,
            address: v.address,
            lat: v.lat,
            lng: v.lng,
            rating: v.rating,
            priceLevel: v.priceLevel,
            phoneNumber: v.phoneNumber,
            website: v.website,
            photoRefs: v.photoRefs,
            types: v.types,
            capacity: v.capacity,
            description: v.description,
          }));

          return { venues, count: venues.length };
        } catch (error) {
          return { venues: [], count: 0 };
        }
      },
    }),

    getVenueDetails: tool({
      description:
        "Get detailed information about a specific venue by its ID or place ID.",
      inputSchema: z.object({
        venueId: z.string().describe("The venue ID or Google Place ID to look up"),
      }),
      execute: async ({ venueId }): Promise<{ venue: Venue | null }> => {
        try {
          const v = await prisma.venue.findFirst({
            where: {
              OR: [{ id: venueId }, { placeId: venueId }],
            },
          });

          if (!v) return { venue: null };

          return {
            venue: {
              id: v.id,
              placeId: v.placeId,
              name: v.name,
              address: v.address,
              lat: v.lat,
              lng: v.lng,
              rating: v.rating,
              priceLevel: v.priceLevel,
              phoneNumber: v.phoneNumber,
              website: v.website,
              photoRefs: v.photoRefs,
              types: v.types,
              capacity: v.capacity,
              description: v.description,
            },
          };
        } catch {
          return { venue: null };
        }
      },
    }),
  };
}
