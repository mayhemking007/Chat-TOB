/**
 * OpenAI provider for LLM completion.
 * Phase 4.3: real implementation. Feature code uses lib/llm.ts only.
 */

import OpenAI from "openai";

const VALID_ROLES = ["system", "user", "assistant"] as const;
type OpenAIRole = (typeof VALID_ROLES)[number];

type Message = { role: string; content: string };

function toOpenAIMessage(m: Message): { role: OpenAIRole; content: string } {
  const role = VALID_ROLES.includes(m.role as OpenAIRole) ? (m.role as OpenAIRole) : "user";
  return { role, content: m.content };
}

export async function complete(messages: Message[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const client = new OpenAI({ apiKey });

  const openaiMessages = messages.map(toOpenAIMessage);

  const completion = await client.chat.completions.create({
    model,
    messages: openaiMessages,
  });

  const content = completion.choices[0]?.message?.content;
  if (content == null) {
    throw new Error("OpenAI returned no content");
  }
  return content;
}
