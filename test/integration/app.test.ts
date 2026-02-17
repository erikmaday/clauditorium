import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app'
import { clearConversations } from '../../src/services/conversationStore'

const { mockedRunClaude } = vi.hoisted(() => ({
  mockedRunClaude: vi.fn()
}))
const { mockedListAvailableModels } = vi.hoisted(() => ({
  mockedListAvailableModels: vi.fn()
}))

vi.mock('../../src/clients/claudeCli', () => ({
  runClaude: mockedRunClaude
}))
vi.mock('../../src/services/models', () => ({
  listAvailableModels: mockedListAvailableModels
}))

describe('app integration', () => {
  beforeEach(() => {
    mockedRunClaude.mockReset()
    mockedListAvailableModels.mockReset()
    clearConversations()
  })

  it('returns health status', async () => {
    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body).toHaveProperty('strict_mode')
    expect(response.body).toHaveProperty('observability.started_at')
    expect(response.body).toHaveProperty('observability.uptime_seconds')
    expect(response.body).toHaveProperty('readiness.claude_cli')
  })

  it('returns package version info', async () => {
    const app = createApp()
    const response = await request(app).get('/version')

    expect(response.status).toBe(200)
    expect(response.body.version).toBeTypeOf('string')
    expect(response.body.timeout).toBeTypeOf('number')
    expect(response.body).toHaveProperty('cors_enabled')
  })

  it('returns available models', async () => {
    mockedListAvailableModels.mockReturnValueOnce([
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-5-20250929'
    ])

    const app = createApp()
    const response = await request(app).get('/models')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      count: 2,
      models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929']
    })
  })

  it('validates /ask body', async () => {
    const app = createApp()
    const response = await request(app).post('/ask').send({})

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('validation_error')
    expect(response.body.message).toBe('prompt is required')
    expect(response.headers['x-request-id']).toBeDefined()
  })

  it('validates /chat body', async () => {
    const app = createApp()
    const response = await request(app).post('/chat').send({})

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('validation_error')
  })

  it('returns successful /ask response when CLI succeeds', async () => {
    mockedRunClaude.mockResolvedValueOnce('hello from claude')

    const app = createApp()
    const response = await request(app).post('/ask').send({ prompt: 'Hello' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true, response: 'hello from claude' })
  })

  it('returns normalized cli error on /ask failure', async () => {
    mockedRunClaude.mockRejectedValueOnce({
      status: 504,
      error: 'timeout',
      message: 'Request timed out after 120 seconds',
      request_id: 'abcd1234'
    })

    const app = createApp()
    const response = await request(app).post('/ask').send({ prompt: 'Hello' })

    expect(response.status).toBe(504)
    expect(response.body).toEqual({
      error: 'timeout',
      message: 'Request timed out after 120 seconds',
      request_id: 'abcd1234'
    })
  })

  it('returns successful /chat response when CLI succeeds', async () => {
    mockedRunClaude.mockResolvedValueOnce('chat reply')

    const app = createApp()
    const response = await request(app).post('/chat').send({
      message: 'hello'
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      success: true,
      conversation_id: expect.any(String),
      message: { role: 'assistant', content: 'chat reply' },
      conversation: {
        id: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
        expires_at: expect.any(String)
      },
      context: {
        tokens_used: expect.any(Number),
        warn_tokens: expect.any(Number),
        target_tokens: expect.any(Number),
        over_warn: expect.any(Boolean),
        over_target: expect.any(Boolean),
        compacted: expect.any(Boolean),
        compacted_messages: expect.any(Number)
      }
    })
  })

  it('retains context between /chat calls using conversation_id', async () => {
    mockedRunClaude.mockResolvedValueOnce('first reply')
    mockedRunClaude.mockResolvedValueOnce('second reply')

    const app = createApp()
    const first = await request(app).post('/chat').send({
      message: 'hello'
    })

    expect(first.status).toBe(200)
    expect(first.body.conversation_id).toBeTypeOf('string')

    const second = await request(app).post('/chat').send({
      conversation_id: first.body.conversation_id,
      message: 'follow up'
    })

    expect(second.status).toBe(200)
    expect(second.body.conversation_id).toBe(first.body.conversation_id)
    expect(second.body.message).toEqual({ role: 'assistant', content: 'second reply' })
    expect(mockedRunClaude).toHaveBeenCalledTimes(2)
    expect(mockedRunClaude.mock.calls[1]?.[0]).toContain('User: hello')
    expect(mockedRunClaude.mock.calls[1]?.[0]).toContain('Assistant: first reply')
    expect(mockedRunClaude.mock.calls[1]?.[0]).toContain('User: follow up')
  })

  it('deletes conversation by id', async () => {
    mockedRunClaude.mockResolvedValueOnce('first reply')

    const app = createApp()
    const createResponse = await request(app).post('/chat').send({ message: 'hello' })
    const deleteResponse = await request(app).delete(`/chat/${createResponse.body.conversation_id}`)
    const deleteMissingResponse = await request(app).delete(`/chat/${createResponse.body.conversation_id}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.success).toBe(true)
    expect(deleteResponse.body.deleted).toBe(true)
    expect(deleteResponse.body.conversation_id).toBe(createResponse.body.conversation_id)

    expect(deleteMissingResponse.status).toBe(200)
    expect(deleteMissingResponse.body.deleted).toBe(false)
  })

  it('returns validation error when system is sent with conversation_id', async () => {
    const app = createApp()
    const response = await request(app).post('/chat').send({
      conversation_id: 'conv-123',
      message: 'hello?',
      system: 'should fail'
    })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('validation_error')
    expect(response.body.message).toBe('system is only allowed when starting a new conversation')
  })

  it('returns validation error when conversation_id is unknown', async () => {
    const app = createApp()
    const response = await request(app).post('/chat').send({
      conversation_id: 'missing-conversation',
      message: 'hello?'
    })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('validation_error')
    expect(response.body.message).toBe('conversation_id was not found')
  })

  it('returns normalized cli error on /chat failure', async () => {
    mockedRunClaude.mockRejectedValueOnce({
      status: 500,
      error: 'cli_error',
      message: 'Claude CLI returned non-zero exit code',
      request_id: 'abcd1234'
    })

    const app = createApp()
    const response = await request(app).post('/chat').send({
      message: 'hello'
    })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: 'cli_error',
      message: 'Claude CLI returned non-zero exit code',
      request_id: 'abcd1234'
    })
  })

  it('returns not found with request id', async () => {
    const app = createApp()
    const response = await request(app).get('/missing-route')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('not_found')
    expect(response.body.request_id).toBeDefined()
  })
})
