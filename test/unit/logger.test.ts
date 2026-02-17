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

    log('INFO', 'hello')

    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(consoleSpy.mock.calls[0][0]).toContain(' - INFO - hello')
  })

  it('does not log when below threshold', async () => {
    process.env.CLAUDE_API_LOG_LEVEL = 'ERROR'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { log } = await import('../../src/core/logger')

    log('INFO', 'ignored')

    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
