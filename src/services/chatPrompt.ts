import { Message } from '../types/api'

export function formatChatPrompt(messages: Message[], system?: string): string {
  const parts: string[] = []

  if (system) {
    parts.push(`System: ${system}\n`)
  }

  for (const msg of messages) {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
    parts.push(`${role}: ${msg.content}`)
  }

  return parts.join('\n')
}
