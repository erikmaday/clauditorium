import { describe, expect, it } from 'vitest'
import { formatChatPrompt } from '../../src/services/chatPrompt'

describe('formatChatPrompt', () => {
  it('formats messages with roles and system prompt', () => {
    const output = formatChatPrompt(
      [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' }
      ],
      'You are helpful'
    )

    expect(output).toBe('System: You are helpful\n\nUser: Hello\nAssistant: Hi there')
  })

  it('formats messages without system prompt', () => {
    const output = formatChatPrompt([
      { role: 'user', content: 'One' },
      { role: 'assistant', content: 'Two' }
    ])

    expect(output).toBe('User: One\nAssistant: Two')
  })
})
