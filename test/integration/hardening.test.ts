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

  vi.doMock('../../src/services/readiness', () => ({
    getClaudeCliReadiness: () => ({
      status: readinessStatus,
      checked_at: '2026-01-01T00:00:00.000Z',
      ...(readinessStatus === 'ready'
        ? { version: 'claude 1.0.0' }
        : { error: 'claude not found' })
    })
  }))

  const { createApp } = await import('../../src/app')
  return createApp()
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
    const app = await loadAppWithMockedReadiness('not_ready', 'false')

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('degraded')
    expect(response.body.strict_mode).toBe(false)
    expect(response.body.readiness.claude_cli.status).toBe('not_ready')
  })

  it('returns degraded health with 503 when strict mode is enabled', async () => {
    const app = await loadAppWithMockedReadiness('not_ready', 'true')

    const response = await request(app).get('/health')

    expect(response.status).toBe(503)
    expect(response.body.status).toBe('degraded')
    expect(response.body.strict_mode).toBe(true)
    expect(response.body.readiness.claude_cli.status).toBe('not_ready')
  })
})
