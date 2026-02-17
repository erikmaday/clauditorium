import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateOpenApiResponse } from './openapi.helpers'

const ORIGINAL_ENV = process.env
const mockedRunClaude = vi.hoisted(() => vi.fn())

vi.mock('../../src/clients/claudeCli', () => ({
  runClaude: mockedRunClaude
}))

afterEach(() => {
  process.env = ORIGINAL_ENV
  mockedRunClaude.mockReset()
  vi.resetModules()
})

async function createFreshApp() {
  const { createApp } = await import('../../src/app')
  return createApp()
}

function expectOpenApi(path: string, method: 'get' | 'post' | 'delete', status: number, body: unknown): void {
  const validation = validateOpenApiResponse(path, method, status, body)
  expect(validation, validation?.message).toBeUndefined()
}

describe('OpenAPI response contract', () => {
  it('validates /ask 200', async () => {
    mockedRunClaude.mockResolvedValueOnce('hello')
    const app = await createFreshApp()

    const response = await request(app).post('/ask').send({ prompt: 'hi' })

    expect(response.status).toBe(200)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 400', async () => {
    const app = await createFreshApp()
    const response = await request(app).post('/ask').send({})

    expect(response.status).toBe(400)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 401', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret' }
    const app = await createFreshApp()

    const response = await request(app).post('/ask').send({ prompt: 'hi' })

    expect(response.status).toBe(401)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 413', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_BODY_LIMIT: '1kb' }
    const app = await createFreshApp()

    const response = await request(app).post('/ask').send({ prompt: 'x'.repeat(2048) })

    expect(response.status).toBe(413)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 429', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS: '60',
      CLAUDE_API_RATE_LIMIT_MAX_REQUESTS: '1'
    }

    mockedRunClaude.mockResolvedValue('ok')
    const app = await createFreshApp()

    await request(app).post('/ask').send({ prompt: 'one' })
    const response = await request(app).post('/ask').send({ prompt: 'two' })

    expect(response.status).toBe(429)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 500', async () => {
    mockedRunClaude.mockRejectedValueOnce({
      status: 500,
      error: 'cli_error',
      message: 'Claude CLI returned non-zero exit code',
      request_id: 'abcd1234'
    })

    const app = await createFreshApp()
    const response = await request(app).post('/ask').send({ prompt: 'hello' })

    expect(response.status).toBe(500)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 504', async () => {
    mockedRunClaude.mockRejectedValueOnce({
      status: 504,
      error: 'timeout',
      message: 'Request timed out',
      request_id: 'abcd1234'
    })

    const app = await createFreshApp()
    const response = await request(app).post('/ask').send({ prompt: 'hello' })

    expect(response.status).toBe(504)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /ask 503 during drain mode', async () => {
    const app = await createFreshApp()
    const { startDrainMode } = await import('../../src/services/shutdown')
    startDrainMode('SIGTERM')

    const response = await request(app).post('/ask').send({ prompt: 'hello' })

    expect(response.status).toBe(503)
    expectOpenApi('/ask', 'post', response.status, response.body)
  })

  it('validates /chat 200', async () => {
    mockedRunClaude.mockResolvedValueOnce('chat reply')
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({ message: 'hi' })

    expect(response.status).toBe(200)
    expect(response.body.conversation_id).toBeTypeOf('string')
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 200 continuation with conversation_id', async () => {
    mockedRunClaude.mockResolvedValueOnce('first')
    mockedRunClaude.mockResolvedValueOnce('second')
    const app = await createFreshApp()

    const first = await request(app).post('/chat').send({ message: 'hi' })
    const second = await request(app).post('/chat').send({
      conversation_id: first.body.conversation_id,
      message: 'follow up'
    })

    expect(second.status).toBe(200)
    expect(second.body.conversation_id).toBe(first.body.conversation_id)
    expectOpenApi('/chat', 'post', second.status, second.body)
  })

  it('validates /chat 400', async () => {
    const app = await createFreshApp()
    const response = await request(app).post('/chat').send({})

    expect(response.status).toBe(400)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 401', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret' }
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({ message: 'hello' })

    expect(response.status).toBe(401)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 413', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_BODY_LIMIT: '1kb' }
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({
      message: 'x'.repeat(2048)
    })

    expect(response.status).toBe(413)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 429', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS: '60',
      CLAUDE_API_RATE_LIMIT_MAX_REQUESTS: '1'
    }

    mockedRunClaude.mockResolvedValue('ok')
    const app = await createFreshApp()

    await request(app).post('/chat').send({ message: 'one' })
    const response = await request(app).post('/chat').send({ message: 'two' })

    expect(response.status).toBe(429)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 500', async () => {
    mockedRunClaude.mockRejectedValueOnce({
      status: 500,
      error: 'cli_error',
      message: 'Claude CLI returned non-zero exit code',
      request_id: 'abcd1234'
    })
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({ message: 'hello' })

    expect(response.status).toBe(500)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 504', async () => {
    mockedRunClaude.mockRejectedValueOnce({
      status: 504,
      error: 'timeout',
      message: 'Request timed out',
      request_id: 'abcd1234'
    })
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({ message: 'hello' })

    expect(response.status).toBe(504)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 503 during drain mode', async () => {
    const app = await createFreshApp()
    const { startDrainMode } = await import('../../src/services/shutdown')
    startDrainMode('SIGTERM')

    const response = await request(app).post('/chat').send({ message: 'hello' })

    expect(response.status).toBe(503)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat/{conversation_id} delete 200', async () => {
    mockedRunClaude.mockResolvedValueOnce('chat reply')
    const app = await createFreshApp()

    const created = await request(app).post('/chat').send({ message: 'hi' })
    const deleted = await request(app).delete(`/chat/${created.body.conversation_id}`)

    expect(deleted.status).toBe(200)
    expectOpenApi('/chat/{conversation_id}', 'delete', deleted.status, deleted.body)
  })

  it('validates /chat/{conversation_id} get 200', async () => {
    mockedRunClaude.mockResolvedValueOnce('chat reply')
    const app = await createFreshApp()

    const created = await request(app).post('/chat').send({ message: 'hi' })
    const metadata = await request(app).get(`/chat/${created.body.conversation_id}`)

    expect(metadata.status).toBe(200)
    expectOpenApi('/chat/{conversation_id}', 'get', metadata.status, metadata.body)
  })

  it('validates /chat/{conversation_id} get 404', async () => {
    const app = await createFreshApp()

    const metadata = await request(app).get('/chat/missing-conversation')

    expect(metadata.status).toBe(404)
    expectOpenApi('/chat/{conversation_id}', 'get', metadata.status, metadata.body)
  })

  it('validates /health 200 and /health 503', async () => {
    const app = await createFreshApp()
    const healthy = await request(app).get('/health')

    expect(healthy.status).toBe(200)
    expectOpenApi('/health', 'get', healthy.status, healthy.body)

    vi.resetModules()
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_STRICT_HEALTH: 'true' }
    vi.doMock('../../src/services/readiness', () => ({
      checkClaudeCliReadiness: vi.fn(),
      getClaudeCliReadiness: () => ({ status: 'not_ready', checked_at: '2026-01-01T00:00:00.000Z' }),
      getClaudeCliReadinessHistory: () => [],
      getProcessObservability: () => ({
        started_at: '2026-01-01T00:00:00.000Z',
        uptime_seconds: 1,
        claude_runtime: {
          active_requests: 0,
          queued_requests: 0,
          max_concurrent: 4,
          max_queue: 100,
          rejected_total: 0,
          queue_timeouts_total: 0
        }
      })
    }))

    const { createApp: createStrictApp } = await import('../../src/app')
    const strictApp = createStrictApp()
    const degraded = await request(strictApp).get('/health')

    expect(degraded.status).toBe(503)
    expectOpenApi('/health', 'get', degraded.status, degraded.body)
  })

  it('validates /health/history 200 and 400', async () => {
    const app = await createFreshApp()

    const ok = await request(app).get('/health/history')
    expect(ok.status).toBe(200)
    expectOpenApi('/health/history', 'get', ok.status, ok.body)

    const bad = await request(app).get('/health/history').query({ since: 'not-a-date' })
    expect(bad.status).toBe(400)
    expectOpenApi('/health/history', 'get', bad.status, bad.body)
  })

  it('validates /health/recheck 401 and 503', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret' }
    const app = await createFreshApp()

    const unauthorized = await request(app).post('/health/recheck')
    expect(unauthorized.status).toBe(401)
    expectOpenApi('/health/recheck', 'post', unauthorized.status, unauthorized.body)

    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
    const noKeyApp = await createFreshApp()

    const missingKeyConfig = await request(noKeyApp).post('/health/recheck')
    expect(missingKeyConfig.status).toBe(503)
    expectOpenApi('/health/recheck', 'post', missingKeyConfig.status, missingKeyConfig.body)
  })

  it('validates /health/recheck 200', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret' }
    const app = await createFreshApp()

    const response = await request(app).post('/health/recheck').set('x-api-key', 'secret')

    expect(response.status).toBe(200)
    expectOpenApi('/health/recheck', 'post', response.status, response.body)
  })

  it('validates /version 200', async () => {
    const app = await createFreshApp()
    const response = await request(app).get('/version')

    expect(response.status).toBe(200)
    expectOpenApi('/version', 'get', response.status, response.body)
  })

  it('validates /models 200', async () => {
    vi.resetModules()
    vi.doMock('../../src/services/models', () => ({
      listAvailableModels: () => ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929']
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()
    const response = await request(app).get('/models')

    expect(response.status).toBe(200)
    expectOpenApi('/models', 'get', response.status, response.body)
  })

  it('validates /models 500', async () => {
    vi.resetModules()
    vi.doMock('../../src/services/models', () => ({
      listAvailableModels: () => {
        throw {
          status: 500,
          error: 'models_unavailable',
          message: 'claude not found',
          request_id: 'abcd1234'
        }
      }
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()
    const response = await request(app).get('/models')

    expect(response.status).toBe(500)
    expectOpenApi('/models', 'get', response.status, response.body)
  })

})
