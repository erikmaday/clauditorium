import { Message } from '../types/api'
import { randomUUID } from 'crypto'

interface ConversationState {
  id: string
  system?: string
  messages: Message[]
}

const conversations = new Map<string, ConversationState>()

export function getConversation(conversationId: string): ConversationState | undefined {
  return conversations.get(conversationId)
}

export function createConversation(initial: { system?: string; messages: Message[] }): ConversationState {
  const id = randomUUID()
  const state: ConversationState = {
    id,
    system: initial.system,
    messages: [...initial.messages]
  }
  conversations.set(id, state)
  return state
}

export function saveConversation(state: ConversationState): void {
  conversations.set(state.id, state)
}

export function clearConversations(): void {
  conversations.clear()
}
