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

function expectOpenApi(path: string, method: 'get' | 'post', status: number, body: unknown): void {
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

  it('validates /chat 200', async () => {
    mockedRunClaude.mockResolvedValueOnce('chat reply')
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({ messages: [{ role: 'user', content: 'hi' }] })

    expect(response.status).toBe(200)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 400', async () => {
    const app = await createFreshApp()
    const response = await request(app).post('/chat').send({ messages: [] })

    expect(response.status).toBe(400)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 401', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret' }
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({ messages: [{ role: 'user', content: 'hello' }] })

    expect(response.status).toBe(401)
    expectOpenApi('/chat', 'post', response.status, response.body)
  })

  it('validates /chat 413', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_BODY_LIMIT: '1kb' }
    const app = await createFreshApp()

    const response = await request(app).post('/chat').send({
      messages: [{ role: 'user', content: 'x'.repeat(2048) }]
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

    await request(app).post('/chat').send({ messages: [{ role: 'user', content: 'one' }] })
    const response = await request(app).post('/chat').send({ messages: [{ role: 'user', content: 'two' }] })

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

    const response = await request(app).post('/chat').send({ messages: [{ role: 'user', content: 'hello' }] })

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

    const response = await request(app).post('/chat').send({ messages: [{ role: 'user', content: 'hello' }] })

    expect(response.status).toBe(504)
    expectOpenApi('/chat', 'post', response.status, response.body)
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
      getProcessObservability: () => ({ started_at: '2026-01-01T00:00:00.000Z', uptime_seconds: 1 })
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

  it('validates /openapi.yaml 200', async () => {
    const app = await createFreshApp()
    const response = await request(app).get('/openapi.yaml')

    expect(response.status).toBe(200)
    expectOpenApi('/openapi.yaml', 'get', response.status, response.text)
  })

  it('validates /docs 200', async () => {
    const app = await createFreshApp()
    const response = await request(app).get('/docs')

    expect(response.status).toBe(200)
    expectOpenApi('/docs', 'get', response.status, response.text)
  })
})
