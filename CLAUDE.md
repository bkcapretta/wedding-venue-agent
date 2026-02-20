# Project Overview

This is a web application that helps users find wedding venues in a
city with a flexible radius of how far they're willing to go outside 
the city.

Once given an initial list of wedding venues, the user can refine their
venue search with a personalized wedding venue agent. They can interact 
with the agent to follow-up with more specific requests (e.g. "Venue 
should hold at least 100 guests", "Show me venues that are max $50K",
etc). Each request should build on the last, accumulating 
venue-specific details, never starting the venue query from scratch.

**Deployment**: Not yet deployed

## Main Sections
- Landing page - User enters desired city and radius
- Map - Displays wedding venues on a map
- Chat - Interactive chat interface with wedding venue agent
- Venues - List of eligible venues given user's last input

## Content Focus
- In the **Venues** component, each venue should have a name, address, 
website, phone, rating, and a one-liner describing the unique features 
of the location.
- In the **Map** component, there should be pinned locations that represent 
where the eligible venues exist
- In the **Chat** component, when a user interacts with the agent, the agent
should go re-query the list of eligible venues with the most up-to-date 
user requested criteria. The chat should respond to the user confirming 
they heard their request, and the list of venues in the Venue component
should then update accordingly. 

### Content Guidelines
- The **Chat** component should read like a human conversation, with not too
many details about the venues. That information should lives in the Venues
component. Remember that the user is trying to plan their wedding - this should
be fun for them! Use kindness and patience as they filter down and align on
venues that excite them

## Architecture**
### Tech Stack


### System Flow
**1. Landing Page -> Geocode user location -> Chat Page**

The user enters a location (city) and a radius on the Landing Page (`page.tsx`):
Upon submit, it makes a request to `/api/geocode` to resolve the city address to a latitude 
and longitude

Then navigate to the Chat page with `/chat?lat=...&lng=...&radius=...&location=...` which is
 defined in `chat/page.tsx`

**2. Chat Page Bootstraps Info for the Agent**

`chat/page.tsx` reads the query params and passes them as a `searchContext` to 
`/api/chat`.  It also auto-sends an initial user message, such as "I'm looking for wedding 
venues near Sonoma, CA within 25 miles."

**3. API Route Creates Tools with Context**

`api/chat/route.ts` receives the messages and `searchContext`, calls 
`createTools(searchContext)` to inject the lat/lng/radius into the `searchVenues` tool's 
closure, then hands everything to `streamText` with Claude Sonnet. The agent can call tools 
up to 5 steps.

**4. Agent calls `searchVenues` using the Google Places API**

When Claude calls `searchVenues`, the tool in `lib/agent/tools.ts`:
a: Takes the query string and the closure's lat/lng/radius in kilometers
b: Checks Postgres cache to see if we've already requested venues in city/within radius
c: If so, returns cached nearby venues. 
d: If not, calls function `searchPlaces()` in `lib/google-places.ts` which hits the Google Places 
Text Search API with a bias to the city center and 20 max results
e: Maps the Google response to `Venue` objects
f: Writes each venue into Postgres via Prisma (for later filtering)
g: Return { venues, count } as the tool output

**5. Frontend Extracts Venues from Streamed Tool Results**

Back in `api/chat/page.tsx`, `useMemo` iterates over all the message parts looking for tool outputs 
that contain the word `venues`. Within a single assistant message, venues accumulate (the initial 
searches for both "wedding venues" and "event spaces" merge). Across different messages, the latest 
replaces the previous set (each refinement is a fresh result). The venues are sorted by rating and 
passed to `VenuePanel`.

**6. Display**
The `VenuePanel` renders the map (`MapViewInner` via Leaflet) and the scrollable `VenueList`.
Clicking a marker or card selects a venue and flies the map to its location

TL;DR The agent is the orchestrator. There's no separate API call to fetch venues. Claude decides 
when to search, what query to use, and the tool results stream directly to the UI through the Vercel
 AI SDK's message transport.

