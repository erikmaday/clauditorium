import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  vi.resetModules()
  vi.restoreAllMocks()
})

async function loadAppWithMockedCli(envOverrides: Record<string, string> = {}) {
  process.env = { ...ORIGINAL_ENV, ...envOverrides }

  const runClaude = vi.fn().mockResolvedValue('mocked response')
  vi.doMock('../../src/clients/claudeCli', () => ({ runClaude }))

  const { createApp } = await import('../../src/app')

  return {
    app: createApp(),
    runClaude
  }
}

async function loadAppWithMockedReadiness(
  readinessStatus: 'ready' | 'not_ready',
  strictHealth: 'true' | 'false'
) {
  process.env = { ...ORIGINAL_ENV, CLAUDE_API_STRICT_HEALTH: strictHealth }

  const checkClaudeCliReadiness = vi.fn(() => ({
    status: readinessStatus,
    checked_at: '2026-01-01T00:00:00.000Z',
    check_duration_ms: 12.3,
    exit_code: readinessStatus === 'ready' ? 0 : 1,
    signal: null,
    ...(readinessStatus === 'ready'
      ? { version: 'claude 1.0.0' }
      : { error: 'claude not found' })
  }))

  vi.doMock('../../src/services/readiness', () => ({
    checkClaudeCliReadiness,
    getClaudeCliReadiness: () => ({
      status: readinessStatus,
      checked_at: '2026-01-01T00:00:00.000Z',
      check_duration_ms: 12.3,
      exit_code: readinessStatus === 'ready' ? 0 : 1,
      signal: null,
      ...(readinessStatus === 'ready'
        ? { version: 'claude 1.0.0' }
        : { error: 'claude not found' })
    }),
    getClaudeCliReadinessHistory: () => [],
    getProcessObservability: () => ({
      started_at: '2026-01-01T00:00:00.000Z',
      uptime_seconds: 123.456
    })
  }))

  const { createApp } = await import('../../src/app')
  return { app: createApp(), checkClaudeCliReadiness }
}

describe('runtime hardening', () => {
  it('enforces API key on /ask when configured', async () => {
    const { app, runClaude } = await loadAppWithMockedCli({ CLAUDE_API_KEY: 'secret-key' })

    const response = await request(app).post('/ask').send({ prompt: 'hello' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('unauthorized')
    expect(runClaude).not.toHaveBeenCalled()
  })

  it('allows /ask when correct API key is provided', async () => {
    const { app, runClaude } = await loadAppWithMockedCli({ CLAUDE_API_KEY: 'secret-key' })

    const response = await request(app)
      .post('/ask')
      .set('x-api-key', 'secret-key')
      .send({ prompt: 'hello' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true, response: 'mocked response' })
    expect(runClaude).toHaveBeenCalledOnce()
  })

  it('does not require API key for /health and /version', async () => {
    const { app } = await loadAppWithMockedCli({ CLAUDE_API_KEY: 'secret-key' })

    const health = await request(app).get('/health')
    const version = await request(app).get('/version')

    expect(health.status).toBe(200)
    expect(version.status).toBe(200)
  })

  it('returns 413 when request body exceeds configured limit', async () => {
    const { app } = await loadAppWithMockedCli({ CLAUDE_API_BODY_LIMIT: '1kb' })
    const largePrompt = 'x'.repeat(2 * 1024)

    const response = await request(app).post('/ask').send({ prompt: largePrompt })

    expect(response.status).toBe(413)
    expect(response.body.error).toBe('payload_too_large')
    expect(response.body.message).toContain('1kb')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    const { app } = await loadAppWithMockedCli({
      CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS: '60',
      CLAUDE_API_RATE_LIMIT_MAX_REQUESTS: '1'
    })

    const first = await request(app).post('/ask').send({ prompt: 'one' })
    const second = await request(app).post('/ask').send({ prompt: 'two' })

    expect(first.status).toBe(200)
    expect(second.status).toBe(429)
    expect(second.body.error).toBe('rate_limited')
    expect(second.body.retry_after_seconds).toBeTypeOf('number')
    expect(second.headers['retry-after']).toBeDefined()
  })

  it('logs request duration on response finish', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { app } = await loadAppWithMockedCli({ CLAUDE_API_LOG_LEVEL: 'INFO' })

    await request(app).get('/health')

    const emitted = consoleSpy.mock.calls.some((call) => {
      const line = String(call[0])
      return line.includes('Completed GET /health 200 in')
    })

    expect(emitted).toBe(true)
  })

  it('returns degraded health with 200 when strict mode is disabled', async () => {
    const { app } = await loadAppWithMockedReadiness('not_ready', 'false')

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('degraded')
    expect(response.body.strict_mode).toBe(false)
    expect(response.body.observability.started_at).toBe('2026-01-01T00:00:00.000Z')
    expect(response.body.readiness.claude_cli.status).toBe('not_ready')
  })

  it('returns degraded health with 503 when strict mode is enabled', async () => {
    const { app } = await loadAppWithMockedReadiness('not_ready', 'true')

    const response = await request(app).get('/health')

    expect(response.status).toBe(503)
    expect(response.body.status).toBe('degraded')
    expect(response.body.strict_mode).toBe(true)
    expect(response.body.readiness.claude_cli.status).toBe('not_ready')
  })

  it('rejects /health/recheck when CLAUDE_API_KEY is not configured', async () => {
    const { app } = await loadAppWithMockedReadiness('ready', 'false')

    const response = await request(app).post('/health/recheck')

    expect(response.status).toBe(503)
    expect(response.body.error).toBe('api_key_not_configured')
  })

  it('rejects /health/recheck with invalid API key', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret-key' }
    const checkClaudeCliReadiness = vi.fn()
    vi.doMock('../../src/services/readiness', () => ({
      checkClaudeCliReadiness,
      getClaudeCliReadiness: () => ({ status: 'ready', checked_at: '2026-01-01T00:00:00.000Z' }),
      getClaudeCliReadinessHistory: () => [],
      getProcessObservability: () => ({ started_at: '2026-01-01T00:00:00.000Z', uptime_seconds: 123.456 })
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()

    const response = await request(app).post('/health/recheck').set('x-api-key', 'wrong')

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('unauthorized')
    expect(checkClaudeCliReadiness).not.toHaveBeenCalled()
  })

  it('runs readiness recheck when valid API key is provided', async () => {
    process.env = { ...ORIGINAL_ENV, CLAUDE_API_KEY: 'secret-key' }
    const checkClaudeCliReadiness = vi.fn(() => ({
      status: 'ready',
      checked_at: '2026-01-01T00:00:00.000Z',
      check_duration_ms: 10.2,
      exit_code: 0,
      signal: null,
      version: 'claude 1.0.0'
    }))
    vi.doMock('../../src/services/readiness', () => ({
      checkClaudeCliReadiness,
      getClaudeCliReadiness: () => ({
        status: 'ready',
        checked_at: '2026-01-01T00:00:00.000Z',
        check_duration_ms: 10.2,
        exit_code: 0,
        signal: null,
        version: 'claude 1.0.0'
      }),
      getClaudeCliReadinessHistory: () => [],
      getProcessObservability: () => ({ started_at: '2026-01-01T00:00:00.000Z', uptime_seconds: 123.456 })
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()

    const response = await request(app).post('/health/recheck').set('x-api-key', 'secret-key')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.readiness.claude_cli.check_duration_ms).toBe(10.2)
    expect(checkClaudeCliReadiness).toHaveBeenCalledOnce()
  })

  it('returns readiness history', async () => {
    process.env = { ...ORIGINAL_ENV }
    vi.doMock('../../src/services/readiness', () => ({
      checkClaudeCliReadiness: vi.fn(),
      getClaudeCliReadiness: () => ({ status: 'ready', checked_at: '2026-01-01T00:00:00.000Z' }),
      getClaudeCliReadinessHistory: () => [
        {
          status: 'ready',
          checked_at: '2026-01-01T00:00:00.000Z',
          check_duration_ms: 8.5,
          exit_code: 0,
          signal: null,
          version: 'claude 1.0.0'
        },
        {
          status: 'not_ready',
          checked_at: '2026-01-01T00:05:00.000Z',
          check_duration_ms: 10.2,
          exit_code: 1,
          signal: null,
          error: 'claude not found'
        }
      ],
      getProcessObservability: () => ({ started_at: '2026-01-01T00:00:00.000Z', uptime_seconds: 123.456 })
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()

    const response = await request(app).get('/health/history')

    expect(response.status).toBe(200)
    expect(response.body.observability.started_at).toBe('2026-01-01T00:00:00.000Z')
    expect(response.body.history).toHaveLength(2)
    expect(response.body.history[0].status).toBe('ready')
    expect(response.body.history[1].status).toBe('not_ready')
  })

  it('filters readiness history by since timestamp', async () => {
    process.env = { ...ORIGINAL_ENV }
    vi.doMock('../../src/services/readiness', () => ({
      checkClaudeCliReadiness: vi.fn(),
      getClaudeCliReadiness: () => ({ status: 'ready', checked_at: '2026-01-01T00:00:00.000Z' }),
      getClaudeCliReadinessHistory: () => [
        { status: 'ready', checked_at: '2026-01-01T00:00:00.000Z' },
        { status: 'not_ready', checked_at: '2026-01-01T00:05:00.000Z' }
      ],
      getProcessObservability: () => ({ started_at: '2026-01-01T00:00:00.000Z', uptime_seconds: 123.456 })
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()

    const response = await request(app).get('/health/history').query({ since: '2026-01-01T00:03:00.000Z' })

    expect(response.status).toBe(200)
    expect(response.body.history).toHaveLength(1)
    expect(response.body.history[0].status).toBe('not_ready')
  })

  it('returns validation error for invalid since timestamp', async () => {
    process.env = { ...ORIGINAL_ENV }
    vi.doMock('../../src/services/readiness', () => ({
      checkClaudeCliReadiness: vi.fn(),
      getClaudeCliReadiness: () => ({ status: 'ready', checked_at: '2026-01-01T00:00:00.000Z' }),
      getClaudeCliReadinessHistory: () => [],
      getProcessObservability: () => ({ started_at: '2026-01-01T00:00:00.000Z', uptime_seconds: 123.456 })
    }))
    const { createApp } = await import('../../src/app')
    const app = createApp()

    const response = await request(app).get('/health/history').query({ since: 'not-a-date' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('validation_error')
  })
})
