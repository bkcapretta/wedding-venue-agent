"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useEffect, useRef, useState, Suspense } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { VenuePanel } from "@/components/venues/VenuePanel";
import { Venue } from "@/lib/types";

/** Extract placeIds from the most recent tool result that has a summary array. */
function extractPlaceIds(messages: UIMessage[]): string[] | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const part of messages[i].parts) {
      if (
        part.type.startsWith("tool-") &&
        "state" in part &&
        part.state === "output-available" &&
        "output" in part &&
        part.output &&
        typeof part.output === "object" &&
        "summary" in (part.output as Record<string, unknown>)
      ) {
        const summary = (part.output as { summary: { placeId: string }[] }).summary;
        if (Array.isArray(summary)) {
          return summary.map((s) => s.placeId).filter(Boolean);
        }
      }
    }
  }
  return null;
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");
  const radius = parseFloat(searchParams.get("radius") ?? "25");
  const location = searchParams.get("location") ?? "";

  const hasSentInitial = useRef(false);
  const [venues, setVenues] = useState<Venue[]>([]);

  const transportRef = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: { searchContext: { lat, lng, radius, location } },
    })
  );

  const { messages, status, sendMessage } = useChat({
    transport: transportRef.current,
  });

  // When Claude finishes responding, fetch the relevant venues from Postgres.
  // If tool results contain placeIds, fetch exactly those. Otherwise fetch all nearby.
  const lastMessageCount = useRef(0);
  useEffect(() => {
    if (status === "ready" && messages.length > lastMessageCount.current) {
      lastMessageCount.current = messages.length;

      const placeIds = extractPlaceIds(messages);
      const url = placeIds && placeIds.length > 0
        ? `/api/venues/nearby?placeIds=${placeIds.join(",")}`
        : `/api/venues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;

      fetch(url)
        .then((res) => res.json())
        .then((data: Venue[]) => {
          setVenues(data.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)));
        })
        .catch(() => {});
    }
  }, [status, messages, lat, lng, radius]);

  // Auto-send initial search message
  useEffect(() => {
    if (!hasSentInitial.current && location) {
      hasSentInitial.current = true;
      sendMessage({
        text: `I'm looking for wedding venues near ${location} within ${radius} miles. Please search for wedding venues in this area.`,
      });
    }
  }, [location, radius, sendMessage]);

  const isLoading = status !== "ready";

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  return (
    <div className="flex h-screen">
      {/* Left: Chat — 40% */}
      <div className="w-2/5 border-r border-gray-200 flex flex-col">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
        />
      </div>

      {/* Right: Venues + Map — 60% */}
      <div className="w-3/5 flex flex-col">
        <VenuePanel venues={venues} center={{ lat, lng }} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
