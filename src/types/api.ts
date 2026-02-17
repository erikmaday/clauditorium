import { Request } from 'express'

export interface Message {
  role: string
  content: string
}

export interface AskRequest {
  prompt: string
  model?: string
}

export interface ChatRequest {
  message: string
  conversationId?: string
  system?: string
  model?: string
}

export interface RequestWithId extends Request {
  requestId?: string
}

export interface CliError {
  status: number
  error: string
  message: string
  request_id: string
}

export interface ApiErrorResponse {
  error: string
  message: string
  request_id?: string
  details?: unknown
}

export interface AskResponse {
  success: true
  response: string
}

export interface ChatConversationMeta {
  id: string
  created_at: string
  updated_at: string
  expires_at: string
}

export interface ChatContextMeta {
  tokens_used: number
  warn_tokens: number
  target_tokens: number
  over_warn: boolean
  over_target: boolean
  compacted: boolean
  compacted_messages: number
}

export interface ChatResponse {
  success: true
  conversation_id: string
  message: Message
  conversation: ChatConversationMeta
  context: ChatContextMeta
}

export interface DeleteConversationResponse {
  success: true
  conversation_id: string
  deleted: boolean
  request_id?: string
}

export interface VersionResponse {
  version: string
  timeout: number
  cors_enabled: boolean
}

export interface ModelsResponse {
  count: number
  models: string[]
}

export interface ClaudeCliReadinessData {
  status: 'ready' | 'not_ready' | 'unknown'
  checked_at: string
  check_duration_ms?: number
  exit_code?: number | null
  signal?: string | null
  version?: string
  error?: string
}

export interface ProcessObservabilityData {
  started_at: string
  uptime_seconds: number
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  strict_mode: boolean
  observability: ProcessObservabilityData
  readiness: {
    claude_cli: ClaudeCliReadinessData
  }
}

export interface HealthHistoryResponse {
  observability: ProcessObservabilityData
  history: ClaudeCliReadinessData[]
}
