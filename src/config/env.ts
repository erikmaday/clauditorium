import { ValidationError } from '../core/errors'

function parseIntegerEnv(value: string | undefined, fallback: number, field: string): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new ValidationError(`${field} must be a valid integer`)
  }

  return parsed
}

function parseLogLevel(value: string | undefined): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' {
  if (!value) {
    return 'INFO'
  }

  const level = value.toUpperCase()
  if (level === 'DEBUG' || level === 'INFO' || level === 'WARN' || level === 'ERROR') {
    return level
  }

  throw new ValidationError('CLAUDE_API_LOG_LEVEL must be one of DEBUG, INFO, WARN, ERROR')
}

const port = parseIntegerEnv(process.env.CLAUDE_API_PORT, 5051, 'CLAUDE_API_PORT')
if (port < 1 || port > 65535) {
  throw new ValidationError('CLAUDE_API_PORT must be between 1 and 65535')
}

const timeoutSeconds = parseIntegerEnv(process.env.CLAUDE_API_TIMEOUT, 120, 'CLAUDE_API_TIMEOUT')
if (timeoutSeconds < 1) {
  throw new ValidationError('CLAUDE_API_TIMEOUT must be at least 1 second')
}

export const config = {
  host: process.env.CLAUDE_API_HOST || '127.0.0.1',
  port,
  timeoutMs: timeoutSeconds * 1000,
  corsEnabled: process.env.CLAUDE_API_CORS?.toLowerCase() === 'true',
  logLevel: parseLogLevel(process.env.CLAUDE_API_LOG_LEVEL)
}

export const CLAUDE_SPAWN_ENV_BLOCKLIST = [
  'CLAUDECODE',
  'CLAUDE_CODE_ENTRYPOINT',
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'
]
