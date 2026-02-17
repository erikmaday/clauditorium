import { getClaudeRuntimeStats } from './claudeRuntimeQueue'

interface DrainState {
  draining: boolean
  started_at?: string
  signal?: string
}

const drainState: DrainState = {
  draining: false
}

export function isDraining(): boolean {
  return drainState.draining
}

export function startDrainMode(signal?: string): void {
  if (drainState.draining) {
    return
  }

  drainState.draining = true
  drainState.started_at = new Date().toISOString()
  drainState.signal = signal
}

export function getDrainState(): DrainState {
  return { ...drainState }
}

export function clearDrainModeForTests(): void {
  drainState.draining = false
  delete drainState.started_at
  delete drainState.signal
}

export async function waitForClaudeDrain(timeoutMs: number, pollMs: number = 100): Promise<boolean> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() <= deadline) {
    const stats = getClaudeRuntimeStats()
    if (stats.active_requests === 0 && stats.queued_requests === 0) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs))
  }

  return false
}
