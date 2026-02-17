import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  vi.useRealTimers()
  vi.resetModules()
})

describe('conversationStore', () => {
  it('creates and updates conversation metadata and context usage', async () => {
    process.env = { ...ORIGINAL_ENV }
    const { createConversation, saveConversation, getConversation, clearConversations } = await import('../../src/services/conversationStore')

    const created = createConversation({
      message: { role: 'user', content: 'hello' },
      system: 'be concise'
    })
    expect(created.id).toBeTypeOf('string')
    expect(created.charsUsed).toBeGreaterThan(0)
    expect(created.expiresAt).toBeTypeOf('string')

    created.messages.push({ role: 'assistant', content: 'hi' })
    saveConversation(created)
    const reloaded = getConversation(created.id)

    expect(reloaded).toBeDefined()
    expect(reloaded?.charsUsed).toBeGreaterThan(created.charsUsed - 1)

    clearConversations()
  })

  it('expires conversations after inactivity ttl', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_CONVERSATION_TTL_SECONDS: '10'
    }

    const { createConversation, getConversation, clearConversations } = await import('../../src/services/conversationStore')
    const created = createConversation({
      message: { role: 'user', content: 'hello' }
    })
    expect(getConversation(created.id)).toBeDefined()

    vi.setSystemTime(new Date('2026-01-01T00:00:11.000Z'))
    expect(getConversation(created.id)).toBeUndefined()

    clearConversations()
  })

  it('evicts oldest inactive conversation when max capacity is reached', async () => {
    vi.useFakeTimers()
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_MAX_CONVERSATIONS: '2'
    }
    const { createConversation, getConversation, clearConversations } = await import('../../src/services/conversationStore')

    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const first = createConversation({ message: { role: 'user', content: 'first' } })
    vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'))
    const second = createConversation({ message: { role: 'user', content: 'second' } })
    vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'))
    const third = createConversation({ message: { role: 'user', content: 'third' } })

    expect(getConversation(first.id)).toBeUndefined()
    expect(getConversation(second.id)).toBeDefined()
    expect(getConversation(third.id)).toBeDefined()

    clearConversations()
  })

  it('deletes conversation by id', async () => {
    process.env = { ...ORIGINAL_ENV }
    const { createConversation, deleteConversation, getConversation, clearConversations } = await import('../../src/services/conversationStore')

    const created = createConversation({ message: { role: 'user', content: 'hello' } })
    expect(deleteConversation(created.id)).toBe(true)
    expect(deleteConversation(created.id)).toBe(false)
    expect(getConversation(created.id)).toBeUndefined()

    clearConversations()
  })
})
