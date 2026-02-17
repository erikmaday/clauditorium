import { ValidationError } from '../core/errors'
import { AskRequest, ChatRequest, Message } from '../types/api'

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

function parseMessage(value: unknown): Message {
  if (!value || typeof value !== 'object') {
    throw new ValidationError('each message must be an object')
  }

  const role = (value as Record<string, unknown>).role
  const content = (value as Record<string, unknown>).content

  if (!isNonEmptyString(role)) {
    throw new ValidationError('each message.role must be a non-empty string')
  }

  if (!isNonEmptyString(content)) {
    throw new ValidationError('each message.content must be a non-empty string')
  }

  return { role, content }
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
  if (messagesValue !== undefined && (!Array.isArray(messagesValue) || messagesValue.length === 0)) {
    throw new ValidationError('messages must be a non-empty array when provided')
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

  if (messagesValue === undefined && messageValue === undefined) {
    throw new ValidationError('provide either messages or message')
  }

  return {
    messages: Array.isArray(messagesValue) ? messagesValue.map(parseMessage) : undefined,
    message: messageValue as string | undefined,
    conversationId: conversationIdValue as string | undefined,
    system: systemValue as string | undefined,
    model: parseModel((body as Record<string, unknown>).model)
  }
}
