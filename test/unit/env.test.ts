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
    expect(config.conversationTtlMs).toBe(86400000)
    expect(config.maxConversations).toBe(1000)
    expect(config.contextWarnTokens).toBe(12000)
    expect(config.contextTargetTokens).toBe(18000)
    expect(config.contextCompactKeepMessages).toBe(6)
    expect(config.contextSummaryMaxChars).toBe(2000)
    expect(config.isolateClaudeCwd).toBe(true)
    expect(config.claudeCwd).toBeTypeOf('string')
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
      CLAUDE_API_CONVERSATION_TTL_SECONDS: '3600',
      CLAUDE_API_MAX_CONVERSATIONS: '250',
      CLAUDE_API_CONTEXT_WARN_TOKENS: '5000',
      CLAUDE_API_CONTEXT_TARGET_TOKENS: '7000',
      CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES: '4',
      CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS: '1000',
      CLAUDE_API_ISOLATE_CWD: 'false',
      CLAUDE_API_CLAUDE_CWD: '/tmp/custom-claude-dir',
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
      conversationTtlMs: 3600000,
      maxConversations: 250,
      contextWarnTokens: 5000,
      contextTargetTokens: 7000,
      contextCompactKeepMessages: 4,
      contextSummaryMaxChars: 1000,
      isolateClaudeCwd: false,
      claudeCwd: '/tmp/custom-claude-dir',
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

  it('throws when conversation ttl is below minimum', async () => {
    process.env = { CLAUDE_API_CONVERSATION_TTL_SECONDS: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_CONVERSATION_TTL_SECONDS must be at least 1 second')
  })

  it('throws when max conversations is below minimum', async () => {
    process.env = { CLAUDE_API_MAX_CONVERSATIONS: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_MAX_CONVERSATIONS must be at least 1')
  })

  it('throws when context warn tokens is below minimum', async () => {
    process.env = { CLAUDE_API_CONTEXT_WARN_TOKENS: '0' }
    await expect(import('../../src/config/env')).rejects.toThrow('CLAUDE_API_CONTEXT_WARN_TOKENS must be at least 1')
  })

  it('throws when context target tokens is lower than warn tokens', async () => {
    process.env = {
      CLAUDE_API_CONTEXT_WARN_TOKENS: '5000',
      CLAUDE_API_CONTEXT_TARGET_TOKENS: '4000'
    }
    await expect(import('../../src/config/env')).rejects.toThrow(
      'CLAUDE_API_CONTEXT_TARGET_TOKENS must be greater than or equal to CLAUDE_API_CONTEXT_WARN_TOKENS'
    )
  })

  it('throws when context compact keep messages is below minimum', async () => {
    process.env = { CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES: '1' }
    await expect(import('../../src/config/env')).rejects.toThrow(
      'CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES must be at least 2'
    )
  })

  it('throws when context summary max chars is below minimum', async () => {
    process.env = { CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS: '199' }
    await expect(import('../../src/config/env')).rejects.toThrow(
      'CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS must be at least 200'
    )
  })
})
