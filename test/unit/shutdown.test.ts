import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockedGetClaudeRuntimeStats } = vi.hoisted(() => ({
  mockedGetClaudeRuntimeStats: vi.fn()
}))

vi.mock('../../src/services/claudeRuntimeQueue', () => ({
  getClaudeRuntimeStats: mockedGetClaudeRuntimeStats
}))

import {
  clearDrainModeForTests,
  getDrainState,
  isDraining,
  startDrainMode,
  waitForClaudeDrain
} from '../../src/services/shutdown'

describe('shutdown service', () => {
  beforeEach(() => {
    clearDrainModeForTests()
    mockedGetClaudeRuntimeStats.mockReset()
  })

  it('enters drain mode once and preserves initial signal metadata', () => {
    expect(isDraining()).toBe(false)

    startDrainMode('SIGTERM')
    const first = getDrainState()
    startDrainMode('SIGINT')
    const second = getDrainState()

    expect(first.draining).toBe(true)
    expect(first.signal).toBe('SIGTERM')
    expect(first.started_at).toBeTypeOf('string')
    expect(second.signal).toBe('SIGTERM')
    expect(second.started_at).toBe(first.started_at)
  })

  it('returns true when queue drains within timeout', async () => {
    mockedGetClaudeRuntimeStats
      .mockReturnValueOnce({
        active_requests: 1,
        queued_requests: 0
      })
      .mockReturnValueOnce({
        active_requests: 0,
        queued_requests: 0
      })

    const drained = await waitForClaudeDrain(100, 10)

    expect(drained).toBe(true)
  })

  it('returns false when queue does not drain before timeout', async () => {
    mockedGetClaudeRuntimeStats.mockReturnValue({
      active_requests: 1,
      queued_requests: 1
    })

    const drained = await waitForClaudeDrain(30, 10)

    expect(drained).toBe(false)
  })
})
