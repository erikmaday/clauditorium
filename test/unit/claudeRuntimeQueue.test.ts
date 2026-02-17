import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = process.env

afterEach(() => {
  process.env = ORIGINAL_ENV
  vi.useRealTimers()
  vi.resetModules()
})

describe('claudeRuntimeQueue', () => {
  it('runs task immediately when concurrency slot is available', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_MAX_CONCURRENT: '2',
      CLAUDE_API_MAX_QUEUE: '10',
      CLAUDE_API_QUEUE_TIMEOUT_MS: '1000'
    }

    const { enqueueClaudeTask, clearClaudeRuntimeQueueForTests } = await import('../../src/services/claudeRuntimeQueue')

    const value = await enqueueClaudeTask('req-1', async () => 'ok')
    expect(value).toBe('ok')

    clearClaudeRuntimeQueueForTests()
  })

  it('rejects when queue is full', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_MAX_CONCURRENT: '1',
      CLAUDE_API_MAX_QUEUE: '0',
      CLAUDE_API_QUEUE_TIMEOUT_MS: '1000'
    }

    const { enqueueClaudeTask, clearClaudeRuntimeQueueForTests } = await import('../../src/services/claudeRuntimeQueue')

    let releaseFirst: ((value: string) => void) | undefined
    const first = enqueueClaudeTask('req-first', () => new Promise<string>((resolve) => {
      releaseFirst = resolve
    }))

    await expect(enqueueClaudeTask('req-second', async () => 'second')).rejects.toMatchObject({
      status: 429,
      error: 'concurrency_limited'
    })

    releaseFirst?.('done')
    await first
    clearClaudeRuntimeQueueForTests()
  })

  it('rejects queued request when queue wait exceeds timeout', async () => {
    vi.useFakeTimers()
    process.env = {
      ...ORIGINAL_ENV,
      CLAUDE_API_MAX_CONCURRENT: '1',
      CLAUDE_API_MAX_QUEUE: '1',
      CLAUDE_API_QUEUE_TIMEOUT_MS: '10'
    }

    const { enqueueClaudeTask, clearClaudeRuntimeQueueForTests } = await import('../../src/services/claudeRuntimeQueue')

    let releaseFirst: (() => void) | undefined
    const first = enqueueClaudeTask('req-first', () => new Promise<string>((resolve) => {
      releaseFirst = () => resolve('first-done')
    }))
    const queued = enqueueClaudeTask('req-queued', async () => 'queued-done')
    const queuedExpectation = expect(queued).rejects.toMatchObject({
      status: 504,
      error: 'queue_timeout'
    })

    await vi.advanceTimersByTimeAsync(11)
    await queuedExpectation

    releaseFirst?.()
    await first
    clearClaudeRuntimeQueueForTests()
  })
})
