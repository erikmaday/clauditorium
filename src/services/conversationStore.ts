import { Message } from '../types/api'
import { randomUUID } from 'crypto'
import { config } from '../config/env'
import { estimateConversationTokens } from './tokenBudget'

export interface ConversationState {
  id: string
  system?: string
  messages: Message[]
  tokensUsed: number
  createdAt: string
  updatedAt: string
  expiresAt: string
}

const conversations = new Map<string, ConversationState>()

export function getConversation(conversationId: string): ConversationState | undefined {
  pruneExpiredConversations()
  return conversations.get(conversationId)
}

export function createConversation(initial: { system?: string; message: Message }, model?: string): ConversationState {
  pruneExpiredConversations()
  ensureCapacityForNewConversation()

  const now = new Date()
  const id = randomUUID()
  const state: ConversationState = {
    id,
    system: initial.system,
    messages: [initial.message],
    tokensUsed: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.conversationTtlMs).toISOString()
  }
  updateConversationStats(state, model)
  conversations.set(id, state)
  return state
}

export function saveConversation(state: ConversationState, model?: string): void {
  state.updatedAt = new Date().toISOString()
  state.expiresAt = new Date(Date.now() + config.conversationTtlMs).toISOString()
  updateConversationStats(state, model)
  conversations.set(state.id, state)
  pruneExpiredConversations()
  ensureCapacity()
}

export function deleteConversation(conversationId: string): boolean {
  return conversations.delete(conversationId)
}

export function clearConversations(): void {
  conversations.clear()
}

function updateConversationStats(state: ConversationState, model?: string): void {
  state.tokensUsed = estimateConversationTokens(state.messages, state.system, model)
}

function pruneExpiredConversations(nowMs: number = Date.now()): void {
  for (const [id, state] of conversations) {
    if (Date.parse(state.expiresAt) <= nowMs) {
      conversations.delete(id)
    }
  }
}

function ensureCapacityForNewConversation(): void {
  ensureCapacity(config.maxConversations - 1)
}

function ensureCapacity(maxAllowed: number = config.maxConversations): void {
  if (conversations.size <= maxAllowed) {
    return
  }

  const sortedByOldestInactive = [...conversations.values()].sort(
    (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
  )

  for (const conversation of sortedByOldestInactive) {
    if (conversations.size <= maxAllowed) {
      break
    }

    conversations.delete(conversation.id)
  }
}
