// MOCK MODE: Replace with real Anthropic API when ready
// import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
// import { anthropic } from "@ai-sdk/anthropic";
// import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
// import { createTools } from "@/lib/agent/tools";
import { SearchContext, Venue } from "@/lib/types";
import { searchPlaces } from "@/lib/google-places";

const MOCK_VENUES = [
  {
    id: "mock-1", placeId: "mock-1", name: "The Brooklyn Winery",
    address: "213 N 8th St, Brooklyn, NY 11211",
    lat: 40.7178, lng: -73.9575, rating: 4.7, priceLevel: 3,
    phoneNumber: "(347) 763-1506", website: "https://bkwinery.com",
    photoRefs: [], types: ["wedding_venue", "winery"], capacity: 150, description: "Urban winery with rustic charm",
  },
  {
    id: "mock-2", placeId: "mock-2", name: "501 Union",
    address: "501 Union St, Brooklyn, NY 11215",
    lat: 40.6808, lng: -73.9836, rating: 4.8, priceLevel: 4,
    phoneNumber: "(718) 408-1500", website: "https://501union.com",
    photoRefs: [], types: ["event_venue", "wedding_venue"], capacity: 200, description: "Industrial-chic event space",
  },
  {
    id: "mock-3", placeId: "mock-3", name: "Prospect Park Boathouse",
    address: "101 East Dr, Brooklyn, NY 11225",
    lat: 40.6652, lng: -73.9653, rating: 4.5, priceLevel: 3,
    phoneNumber: "(718) 287-3474", website: "https://prospectpark.org",
    photoRefs: [], types: ["wedding_venue", "park"], capacity: 175, description: "Waterfront venue in Prospect Park",
  },
  {
    id: "mock-4", placeId: "mock-4", name: "The Green Building",
    address: "452 Union St, Brooklyn, NY 11231",
    lat: 40.6802, lng: -73.9882, rating: 4.6, priceLevel: 3,
    phoneNumber: "(718) 522-3363", website: "https://thegreenbuildingnyc.com",
    photoRefs: [], types: ["event_venue", "wedding_venue"], capacity: 250, description: "Restored brass factory with garden",
  },
  {
    id: "mock-5", placeId: "mock-5", name: "Celestine",
    address: "1 John St, Brooklyn, NY 11201",
    lat: 40.7042, lng: -73.9903, rating: 4.4, priceLevel: 3,
    phoneNumber: "(718) 522-5700", website: "https://celestinebk.com",
    photoRefs: [], types: ["restaurant", "event_venue"], capacity: 120, description: "Mediterranean restaurant with waterfront views",
  },
  {
    id: "mock-6", placeId: "mock-6", name: "Aurora Brooklyn",
    address: "70 Grand St, Brooklyn, NY 11249",
    lat: 40.7141, lng: -73.9628, rating: 4.3, priceLevel: 2,
    phoneNumber: "(718) 388-5100", website: "https://aurorabk.com",
    photoRefs: [], types: ["restaurant", "private_dining"], capacity: 60, description: "Italian restaurant with private garden",
  },
];

export async function POST(req: Request) {
  const { searchContext }: { messages: unknown; searchContext?: SearchContext } =
    await req.json();

  // Try real Google Places search, fall back to mock data
  let venues: Venue[] = MOCK_VENUES;
  if (searchContext) {
    try {
      const realVenues = await searchPlaces({
        query: "wedding venues",
        lat: searchContext.lat,
        lng: searchContext.lng,
        radiusMeters: searchContext.radiusKm * 1000,
      });
      if (realVenues.length > 0) {
        venues = realVenues;
      }
    } catch {
      // Use mock data on failure
    }
  }

  const venueList = venues
    .map((v) => `- **${v.name}** (${v.rating ? `${v.rating}/5` : "unrated"}) — ${v.address}`)
    .join("\n");

  const assistantText = `Here are some wedding venues I found near ${searchContext?.location ?? "your area"}:\n\n${venueList}\n\nWould you like me to search for non-traditional venues like restaurants, galleries, or rooftops? You can also ask me to filter by rating, price, or capacity.`;

  // Build a mock streaming response that mimics the AI SDK format
  const toolCallId = "mock-tool-call-1";
  const parts = [
    // Tool call part
    `0:{"toolCallId":"${toolCallId}","toolName":"searchVenues","args":{"query":"wedding venues"}}\n`,
    // Tool result part
    `a:{"toolCallId":"${toolCallId}","result":${JSON.stringify({ venues, count: venues.length })}}\n`,
    // Text parts (stream word by word for realism)
    ...assistantText.split(" ").map((word, i) =>
      `0:${JSON.stringify(i === 0 ? word : " " + word)}\n`
    ),
    // Finish
    `e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`,
    `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`,
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part));
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}
