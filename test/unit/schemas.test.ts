import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../src/core/errors'
import { parseAskRequest, parseChatRequest } from '../../src/routes/schemas'

describe('parseAskRequest', () => {
  it('parses valid request', () => {
    const result = parseAskRequest({ prompt: 'Hello', model: 'claude-sonnet' })
    expect(result).toEqual({ prompt: 'Hello', model: 'claude-sonnet' })
  })

  it('throws on missing prompt', () => {
    expect(() => parseAskRequest({})).toThrow(ValidationError)
  })
})

describe('parseChatRequest', () => {
  it('parses valid chat request', () => {
    const result = parseChatRequest({
      messages: [{ role: 'user', content: 'Hello' }],
      system: 'Stay brief',
      model: 'claude-haiku'
    })

    expect(result).toEqual({
      messages: [{ role: 'user', content: 'Hello' }],
      system: 'Stay brief',
      model: 'claude-haiku'
    })
  })

  it('throws when messages is empty', () => {
    expect(() => parseChatRequest({ messages: [] })).toThrow(ValidationError)
  })

  it('throws when a message has empty content', () => {
    expect(() => parseChatRequest({ messages: [{ role: 'user', content: '' }] })).toThrow(ValidationError)
  })

  it('parses continuation request with conversation_id + message', () => {
    const result = parseChatRequest({
      conversation_id: 'conv-123',
      message: 'next question'
    })

    expect(result).toEqual({
      conversationId: 'conv-123',
      message: 'next question',
      messages: undefined,
      system: undefined,
      model: undefined
    })
  })

  it('throws when neither messages nor message is provided', () => {
    expect(() => parseChatRequest({ conversation_id: 'conv-123' })).toThrow(ValidationError)
  })
})
