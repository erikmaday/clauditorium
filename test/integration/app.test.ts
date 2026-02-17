import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app'

const { mockedRunClaude } = vi.hoisted(() => ({
  mockedRunClaude: vi.fn()
}))

vi.mock('../../src/clients/claudeCli', () => ({
  runClaude: mockedRunClaude
}))

describe('app integration', () => {
  beforeEach(() => {
    mockedRunClaude.mockReset()
  })

  it('returns health status', async () => {
    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body).toHaveProperty('strict_mode')
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
    const response = await request(app).post('/chat').send({ messages: [] })

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
      messages: [{ role: 'user', content: 'hello' }]
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      success: true,
      message: { role: 'assistant', content: 'chat reply' }
    })
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
      messages: [{ role: 'user', content: 'hello' }]
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
