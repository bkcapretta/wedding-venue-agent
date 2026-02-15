import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { createTools } from "@/lib/agent/tools";
import { SearchContext } from "@/lib/types";

export async function POST(req: Request) {
  const {
    messages,
    searchContext,
  }: { messages: UIMessage[]; searchContext?: SearchContext } =
    await req.json();

  const tools = createTools(searchContext);

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
