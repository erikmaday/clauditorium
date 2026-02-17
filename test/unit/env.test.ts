import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  vi.resetModules()
})

describe('config/env', () => {
  it('uses defaults when env vars are not set', async () => {
    process.env = {}
    const { config } = await import('../../src/config/env')

    expect(config.host).toBe('127.0.0.1')
    expect(config.port).toBe(5051)
    expect(config.timeoutMs).toBe(120000)
    expect(config.startupCheckTimeoutMs).toBe(5000)
    expect(config.rateLimitWindowMs).toBe(60000)
    expect(config.rateLimitMaxRequests).toBe(0)
    expect(config.healthHistoryLimit).toBe(25)
    expect(config.bodyLimit).toBe('1mb')
    expect(config.corsEnabled).toBe(false)
    expect(config.strictHealth).toBe(false)
    expect(config.logLevel).toBe('INFO')
    expect(config.apiKey).toBeUndefined()
  })

  it('parses valid custom env vars', async () => {
    process.env = {
      CLAUDE_API_HOST: '0.0.0.0',
      CLAUDE_API_PORT: '8080',
      CLAUDE_API_TIMEOUT: '30',
      CLAUDE_API_STARTUP_CHECK_TIMEOUT: '8',
      CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS: '30',
      CLAUDE_API_RATE_LIMIT_MAX_REQUESTS: '5',
      CLAUDE_API_HEALTH_HISTORY_LIMIT: '50',
      CLAUDE_API_BODY_LIMIT: '2mb',
      CLAUDE_API_CORS: 'true',
      CLAUDE_API_LOG_LEVEL: 'debug',
      CLAUDE_API_STRICT_HEALTH: 'true',
      CLAUDE_API_KEY: 'my-key'
    }

    const { config } = await import('../../src/config/env')
    expect(config).toEqual({
      host: '0.0.0.0',
      port: 8080,
      timeoutMs: 30000,
      startupCheckTimeoutMs: 8000,
      rateLimitWindowMs: 30000,
      rateLimitMaxRequests: 5,
      healthHistoryLimit: 50,
      bodyLimit: '2mb',
      corsEnabled: true,
      logLevel: 'DEBUG',
      strictHealth: true,
      apiKey: 'my-key'
    })
  })

  it('throws for invalid integer env vars', async () => {
    process.env = { CLAUDE_API_PORT: 'abc' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_PORT must be a valid integer')
  })

  it('throws for out-of-range port', async () => {
    process.env = { CLAUDE_API_PORT: '70000' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_PORT must be between 1 and 65535')
  })

  it('throws for timeout below minimum', async () => {
    process.env = { CLAUDE_API_TIMEOUT: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_TIMEOUT must be at least 1 second')
  })

  it('throws for invalid log level', async () => {
    process.env = { CLAUDE_API_LOG_LEVEL: 'trace' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_LOG_LEVEL must be one of DEBUG, INFO, WARN, ERROR')
  })

  it('throws when startup check timeout is below minimum', async () => {
    process.env = { CLAUDE_API_STARTUP_CHECK_TIMEOUT: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_STARTUP_CHECK_TIMEOUT must be at least 1 second')
  })

  it('throws when rate limit window is below minimum', async () => {
    process.env = { CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS must be at least 1 second')
  })

  it('throws when rate limit max requests is below minimum', async () => {
    process.env = { CLAUDE_API_RATE_LIMIT_MAX_REQUESTS: '-1' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_RATE_LIMIT_MAX_REQUESTS must be 0 or greater')
  })

  it('throws when health history limit is below minimum', async () => {
    process.env = { CLAUDE_API_HEALTH_HISTORY_LIMIT: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_HEALTH_HISTORY_LIMIT must be at least 1')
  })
})
