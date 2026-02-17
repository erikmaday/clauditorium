import { spawnSync } from 'child_process'
import { config } from '../config/env'

export interface ClaudeCliReadiness {
  status: 'ready' | 'not_ready' | 'unknown'
  checked_at: string
  version?: string
  error?: string
}

let claudeCliReadiness: ClaudeCliReadiness = {
  status: 'unknown',
  checked_at: new Date(0).toISOString()
}

export function getClaudeCliReadiness(): ClaudeCliReadiness {
  return claudeCliReadiness
}

export function checkClaudeCliReadiness(): ClaudeCliReadiness {
  const checkedAt = new Date().toISOString()

  const result = spawnSync('claude', ['--version'], {
    encoding: 'utf8',
    timeout: config.startupCheckTimeoutMs
  })

  if (result.error) {
    claudeCliReadiness = {
      status: 'not_ready',
      checked_at: checkedAt,
      error: result.error.message
    }
    return claudeCliReadiness
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    claudeCliReadiness = {
      status: 'not_ready',
      checked_at: checkedAt,
      error: stderr || `Claude CLI exited with code ${result.status}`
    }
    return claudeCliReadiness
  }

  const version = result.stdout?.trim() || 'unknown'

  claudeCliReadiness = {
    status: 'ready',
    checked_at: checkedAt,
    version
  }

  return claudeCliReadiness
}
