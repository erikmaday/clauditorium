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
      message: 'Hello',
      system: 'Stay brief',
      model: 'claude-haiku'
    })

    expect(result).toEqual({
      message: 'Hello',
      conversationId: undefined,
      system: 'Stay brief',
      model: 'claude-haiku'
    })
  })

  it('throws when messages is provided', () => {
    expect(() => parseChatRequest({ messages: [{ role: 'user', content: 'Hello' }] })).toThrow(ValidationError)
  })

  it('throws when message is empty', () => {
    expect(() => parseChatRequest({ message: '' })).toThrow(ValidationError)
  })

  it('parses continuation request with conversation_id + message', () => {
    const result = parseChatRequest({
      conversation_id: 'conv-123',
      message: 'next question'
    })

    expect(result).toEqual({
      conversationId: 'conv-123',
      message: 'next question',
      system: undefined,
      model: undefined
    })
  })

  it('throws when message is not provided', () => {
    expect(() => parseChatRequest({ conversation_id: 'conv-123' })).toThrow(ValidationError)
  })

  it('throws when system is provided for continuation request', () => {
    expect(() => parseChatRequest({
      conversation_id: 'conv-123',
      message: 'next question',
      system: 'ignored'
    })).toThrow(ValidationError)
  })
})
