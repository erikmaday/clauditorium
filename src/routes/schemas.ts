import { ValidationError } from '../core/errors'
import { AskRequest, ChatRequest } from '../types/api'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parseModel(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!isNonEmptyString(value)) {
    throw new ValidationError('model must be a non-empty string')
  }

  return value
}

export function parseAskRequest(body: unknown): AskRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('request body must be a JSON object')
  }

  const prompt = (body as Record<string, unknown>).prompt
  if (!isNonEmptyString(prompt)) {
    throw new ValidationError('prompt is required')
  }

  return {
    prompt,
    model: parseModel((body as Record<string, unknown>).model)
  }
}

export function parseChatRequest(body: unknown): ChatRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('request body must be a JSON object')
  }

  const messagesValue = (body as Record<string, unknown>).messages
  if (messagesValue !== undefined) {
    throw new ValidationError('messages is no longer supported; use message and optional conversation_id')
  }

  const systemValue = (body as Record<string, unknown>).system
  if (systemValue !== undefined && !isNonEmptyString(systemValue)) {
    throw new ValidationError('system must be a non-empty string when provided')
  }

  const messageValue = (body as Record<string, unknown>).message
  if (messageValue !== undefined && !isNonEmptyString(messageValue)) {
    throw new ValidationError('message must be a non-empty string when provided')
  }

  const conversationIdValue = (body as Record<string, unknown>).conversation_id
  if (conversationIdValue !== undefined && !isNonEmptyString(conversationIdValue)) {
    throw new ValidationError('conversation_id must be a non-empty string when provided')
  }

  if (messageValue === undefined) {
    throw new ValidationError('message is required')
  }

  if (conversationIdValue !== undefined && systemValue !== undefined) {
    throw new ValidationError('system is only allowed when starting a new conversation')
  }

  return {
    message: messageValue as string,
    conversationId: conversationIdValue as string | undefined,
    system: systemValue as string | undefined,
    model: parseModel((body as Record<string, unknown>).model)
  }
}
