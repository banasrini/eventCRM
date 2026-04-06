import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { CRM_TOOLS } from "@/lib/ai/tools";
import { handleTool } from "@/lib/ai/tool-handlers";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { eq, desc } from "drizzle-orm";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const body = await request.json();
  const { message, sessionId, pageContext } = body as {
    message: string;
    sessionId: string;
    pageContext?: { eventId?: string; eventName?: string; sponsorId?: string; sponsorName?: string };
  };

  if (!message || !sessionId) {
    return Response.json({ error: "message and sessionId are required" }, { status: 400 });
  }

  // Load chat history
  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(20);

  const historyMessages: Anthropic.MessageParam[] = history
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const messages: Anthropic.MessageParam[] = [
    ...historyMessages,
    { role: "user", content: message },
  ];

  // Agentic loop
  const toolCallLog: Array<{ tool: string; input: unknown; result: unknown }> = [];
  let finalText = "";

  let currentMessages = [...messages];

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: buildSystemPrompt(pageContext),
      tools: CRM_TOOLS,
      messages: currentMessages,
    });

    if (response.stop_reason === "end_turn") {
      finalText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      ) as Anthropic.ToolUseBlock[];

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await handleTool(block.name, block.input as Record<string, unknown>);
          toolCallLog.push({ tool: block.name, input: block.input, result });
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        })
      );

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      continue;
    }

    // Unexpected stop reason
    break;
  }

  // Persist messages
  const now = new Date().toISOString();
  await db.insert(chatMessages).values([
    {
      id: generateId(),
      sessionId,
      role: "user",
      content: message,
      createdAt: now,
    },
    {
      id: generateId(),
      sessionId,
      role: "assistant",
      content: finalText,
      toolCalls: toolCallLog.length > 0 ? JSON.stringify(toolCallLog) : null,
      createdAt: now,
    },
  ]);

  return Response.json({
    reply: finalText,
    toolCalls: toolCallLog,
  });
}
