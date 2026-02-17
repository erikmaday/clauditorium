import { Message } from '../types/api'

const DEFAULT_CHARS_PER_TOKEN = 4
const MODEL_CHARS_PER_TOKEN: Array<{ matcher: RegExp, charsPerToken: number }> = [
  { matcher: /haiku/i, charsPerToken: 3.6 },
  { matcher: /sonnet/i, charsPerToken: 4.0 },
  { matcher: /opus/i, charsPerToken: 4.3 }
]

const BASE_PROMPT_TOKENS = 8
const MESSAGE_OVERHEAD_TOKENS = 6
const SYSTEM_OVERHEAD_TOKENS = 6

// NOTE: This module intentionally uses heuristic token estimation.
// TODO: Replace with authoritative per-request token usage when the Claude CLI
// exposes stable machine-readable usage telemetry.

function getCharsPerToken(model?: string): number {
  if (!model) {
    return DEFAULT_CHARS_PER_TOKEN
  }

  for (const entry of MODEL_CHARS_PER_TOKEN) {
    if (entry.matcher.test(model)) {
      return entry.charsPerToken
    }
  }

  return DEFAULT_CHARS_PER_TOKEN
}

export function estimateTextTokens(text: string, model?: string): number {
  const charsPerToken = getCharsPerToken(model)
  return Math.max(1, Math.ceil(text.length / charsPerToken))
}

export function estimateConversationTokens(messages: Message[], system?: string, model?: string): number {
  let tokens = BASE_PROMPT_TOKENS

  if (system) {
    tokens += estimateTextTokens(system, model) + SYSTEM_OVERHEAD_TOKENS
  }

  for (const message of messages) {
    tokens += estimateTextTokens(message.role, model)
    tokens += estimateTextTokens(message.content, model)
    tokens += MESSAGE_OVERHEAD_TOKENS
  }

  return tokens
}
