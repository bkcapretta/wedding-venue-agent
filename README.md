# wedding-venue-agent

An agentic-based system that specializes in finding typical and atypical wedding venues in a given region

*Note*: This project is an opportunity to practice building software with LLMs, 
like Claude Code and Google's AI Studio.

## How does it work?

### Landing Page
Enter a location and search radius to begin your venue search.

![Landing Page](img/landing_page.jpg)

### Venue Assistant
An interactive AI assistant helps you find venues, displays them on a map, and lets you refine your search with follow-up messages.

![Venue Assistant](img/venue_assistant.jpg)

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router) with React 19
- **Language**: TypeScript
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) with Anthropic Claude Sonnet
- **Database**: PostgreSQL via [Prisma](https://www.prisma.io/) ORM
- **Maps**: [Leaflet](https://leafletjs.com/) / React Leaflet
- **Venue Data**: Google Places API (Text Search)
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a remote instance)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Google Places API key](https://console.cloud.google.com/)

### Environment Variables

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wedding_venues?schema=public
```

### Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client + push schema to database
npx prisma generate
npx prisma db push

# Start local dev server (http://localhost:3000)
npm run dev
```

### Other Commands

```bash
# Production build
npm run build

# Start production server (after building)
npm start

# Run linter
npm run lint

# Regenerate Prisma client after schema changes
npx prisma generate
```
