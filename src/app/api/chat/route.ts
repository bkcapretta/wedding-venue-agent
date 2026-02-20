import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { createTools } from "@/lib/agent/tools";
import { SearchContext } from "@/lib/types";

// Keep only the last N messages to prevent token overflow.
// The frontend keeps the full history for venue extraction,
// but Claude only needs recent context to continue the conversation.
const MAX_MESSAGES = 10;

export async function POST(req: Request) {
  // Parse the request body sent by the transport
  const {
    messages,
    searchContext,
  }: { messages: UIMessage[]; searchContext?: SearchContext } =
    await req.json();

  // Create tools with the user's location baked in
  const tools = createTools(searchContext);

  // Trim to recent messages to stay within token limits
  const recentMessages = messages.slice(-MAX_MESSAGES);

  // Send everything to Claude and stream the response back
  // Claude can respond with text, tool calls, or both
  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(recentMessages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
