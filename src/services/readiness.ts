import { spawnSync } from 'child_process'
import { config } from '../config/env'

export interface ClaudeCliReadiness {
  status: 'ready' | 'not_ready' | 'unknown'
  checked_at: string
  check_duration_ms?: number
  exit_code?: number | null
  signal?: string | null
  version?: string
  error?: string
}

let claudeCliReadiness: ClaudeCliReadiness = {
  status: 'unknown',
  checked_at: new Date(0).toISOString()
}
const processStartedAt = new Date().toISOString()

export function getClaudeCliReadiness(): ClaudeCliReadiness {
  return claudeCliReadiness
}

export function getProcessObservability(): { started_at: string, uptime_seconds: number } {
  return {
    started_at: processStartedAt,
    uptime_seconds: Number(process.uptime().toFixed(3))
  }
}

export function checkClaudeCliReadiness(): ClaudeCliReadiness {
  const checkedAt = new Date().toISOString()
  const start = process.hrtime.bigint()

  const result = spawnSync('claude', ['--version'], {
    encoding: 'utf8',
    timeout: config.startupCheckTimeoutMs
  })
  const checkDurationMs = Number(process.hrtime.bigint() - start) / 1_000_000

  if (result.error) {
    claudeCliReadiness = {
      status: 'not_ready',
      checked_at: checkedAt,
      check_duration_ms: Number(checkDurationMs.toFixed(1)),
      exit_code: result.status,
      signal: result.signal,
      error: result.error.message
    }
    return claudeCliReadiness
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    claudeCliReadiness = {
      status: 'not_ready',
      checked_at: checkedAt,
      check_duration_ms: Number(checkDurationMs.toFixed(1)),
      exit_code: result.status,
      signal: result.signal,
      error: stderr || `Claude CLI exited with code ${result.status}`
    }
    return claudeCliReadiness
  }

  const version = result.stdout?.trim() || 'unknown'

  claudeCliReadiness = {
    status: 'ready',
    checked_at: checkedAt,
    check_duration_ms: Number(checkDurationMs.toFixed(1)),
    exit_code: result.status,
    signal: result.signal,
    version
  }

  return claudeCliReadiness
}
