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
    expect(config.corsEnabled).toBe(false)
    expect(config.logLevel).toBe('INFO')
  })

  it('parses valid custom env vars', async () => {
    process.env = {
      CLAUDE_API_HOST: '0.0.0.0',
      CLAUDE_API_PORT: '8080',
      CLAUDE_API_TIMEOUT: '30',
      CLAUDE_API_CORS: 'true',
      CLAUDE_API_LOG_LEVEL: 'debug'
    }

    const { config } = await import('../../src/config/env')
    expect(config).toEqual({
      host: '0.0.0.0',
      port: 8080,
      timeoutMs: 30000,
      corsEnabled: true,
      logLevel: 'DEBUG'
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
})
