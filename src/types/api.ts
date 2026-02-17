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
  messages?: Message[]
  message?: string
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
