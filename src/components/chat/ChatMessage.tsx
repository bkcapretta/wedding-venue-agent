"use client";

import { UIMessage } from "ai";
import clsx from "clsx";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-rose-500 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="whitespace-pre-wrap">
                {part.text}
              </div>
            );
          }
          // Tool invocation parts have type like "tool-searchVenues"
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            const state = "state" in part ? (part.state as string) : "pending";
            const output = "output" in part ? (part.output as Record<string, unknown> | undefined) : undefined;
            return (
              <div
                key={i}
                className="text-xs text-gray-500 italic my-1 py-1 border-t border-gray-200"
              >
                {state === "result"
                  ? `Found ${output?.count ?? 0} venues`
                  : `Searching for venues...`}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
