/**
 * LLM adapter: minimal interface for chat completion.
 * Feature code imports only from this file; no provider-specific imports in routes.
 */

export type LlmMessage = { role: string; content: string };

export { complete } from "./providers/openai.js";
