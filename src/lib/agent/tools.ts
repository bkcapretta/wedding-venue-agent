import { tool } from "ai";
import { z } from "zod";
import { searchPlaces } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { Venue, SearchContext } from "@/lib/types";

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

          for (const venue of venues) {
            await prisma.venue.upsert({
              where: { placeId: venue.placeId },
              update: venue,
              create: venue,
            });
          }

          return { venues, count: venues.length };
        } catch (error) {
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

          if (minRating != null) where.rating = { gte: minRating };
          if (maxPriceLevel != null) where.priceLevel = { lte: maxPriceLevel };
          if (minCapacity != null) where.capacity = { gte: minCapacity };
          if (nameOrDescription) {
            where.OR = [
              { name: { contains: nameOrDescription, mode: "insensitive" } },
              { description: { contains: nameOrDescription, mode: "insensitive" } },
            ];
          }
          if (venueTypes?.length) where.types = { hasSome: venueTypes };

          const venues = await prisma.venue.findMany({ where }) as Venue[];
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
          const venue = await prisma.venue.findFirst({
            where: { OR: [{ id: venueId }, { placeId: venueId }] },
          }) as Venue | null;

          return { venue };
        } catch {
          return { venue: null };
        }
      },
    }),
  };
}
