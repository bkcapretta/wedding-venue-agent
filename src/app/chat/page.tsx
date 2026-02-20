"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, Suspense } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { VenuePanel } from "@/components/venues/VenuePanel";
import { Venue } from "@/lib/types";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");
  const radiusKm = parseFloat(searchParams.get("radius") ?? "25");
  const location = searchParams.get("location") ?? "";

  const hasSentInitial = useRef(false);

  const transportRef = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: { searchContext: { lat, lng, radiusKm, location } },
    })
  );

  const { messages, status, sendMessage } = useChat({
    transport: transportRef.current,
  });

  // Auto-send initial search message
  useEffect(() => {
    if (!hasSentInitial.current && location) {
      hasSentInitial.current = true;
      sendMessage({
        text: `I'm looking for wedding venues near ${location} within ${radiusKm} miles. Please search for wedding venues in this area.`,
      });
    }
  }, [location, radiusKm, sendMessage]);

  // Extract venues from tool results. Within a message, tool results accumulate
  // (supports multi-query). Across messages, the latest replaces the previous set.
  const venues = useMemo(() => {
    let venueMap = new Map<string, Venue>();
    let currentMsgId: string | null = null;

    for (const msg of messages) {
      const msgVenues = new Map<string, Venue>();

      for (const part of msg.parts) {
        if (
          part.type.startsWith("tool-") &&
          "output" in part &&
          part.output &&
          typeof part.output === "object" &&
          "venues" in (part.output as Record<string, unknown>)
        ) {
          for (const venue of (part.output as { venues: Venue[] }).venues) {
            msgVenues.set(venue.placeId, venue);
          }
        }
      }

      if (msgVenues.size > 0) {
        venueMap = msg.id === currentMsgId
          ? new Map([...venueMap, ...msgVenues])
          : msgVenues;
        currentMsgId = msg.id;
      }
    }

    return Array.from(venueMap.values()).sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
    );
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

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
