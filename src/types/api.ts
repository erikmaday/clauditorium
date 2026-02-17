import { Request } from 'express'
import type { components } from './openapi.generated'

type Schemas = components['schemas']

export type Message = Schemas['Message']

export type AskRequest = Schemas['AskRequest']

// Internal request shape used by handlers after parsing/normalization.
export interface ChatRequest {
  message: Schemas['ChatRequest']['message']
  conversationId?: Schemas['ChatRequest']['conversation_id']
  system?: Schemas['ChatRequest']['system']
  model?: Schemas['ChatRequest']['model']
}

export interface RequestWithId extends Request {
  requestId?: string
}

export interface CliError {
  status: number
  error: Schemas['ErrorResponse']['error']
  message: Schemas['ErrorResponse']['message']
  request_id: string
}

export type ApiErrorResponse = Schemas['ErrorResponse']
export type AskResponse = Schemas['AskResponse']
export type ChatConversationMeta = Schemas['ChatConversationMeta']
export type ChatContextMeta = Schemas['ChatContextMeta']
export type ChatResponse = Schemas['ChatResponse']
export type DeleteConversationResponse = Schemas['ChatDeleteResponse']
export type VersionResponse = Schemas['VersionResponse']
export type ModelsResponse = Schemas['ModelsResponse']
export type ClaudeCliReadinessData = Schemas['Readiness']
export type ProcessObservabilityData = Schemas['Observability']
export type HealthResponse = Schemas['HealthResponse']
export type HealthHistoryResponse = Schemas['HealthHistoryResponse']
