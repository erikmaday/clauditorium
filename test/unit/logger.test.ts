import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.CLAUDE_API_LOG_LEVEL
  })

  it('logs when message level meets threshold', async () => {
    process.env.CLAUDE_API_LOG_LEVEL = 'INFO'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { log } = await import('../../src/core/logger')

    log('INFO', 'hello', { event: 'test_event', request_id: 'req-1' })

    expect(consoleSpy).toHaveBeenCalled()
    const payload = JSON.parse(String(consoleSpy.mock.calls[0][0]).trim())
    expect(payload.service).toBe('claude-api')
    expect(payload.event).toBe('test_event')
    expect(payload.request_id).toBe('req-1')
    expect(payload.message).toBe('hello')
  })

  it('does not log when below threshold', async () => {
    process.env.CLAUDE_API_LOG_LEVEL = 'ERROR'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { log } = await import('../../src/core/logger')

    log('INFO', 'ignored')

    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
