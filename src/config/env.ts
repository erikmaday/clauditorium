import { ValidationError } from '../core/errors'
import { tmpdir } from 'os'
import { join } from 'path'

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

function parseBodyLimit(value: string | undefined): string {
  if (!value) {
    return '1mb'
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw new ValidationError('CLAUDE_API_BODY_LIMIT must not be empty when provided')
  }

  return trimmed
}

function parseApiKey(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

function parseBooleanEnv(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true'
}

function parseBooleanEnvWithDefault(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue
  }

  return value.toLowerCase() === 'true'
}

function parseOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

const port = parseIntegerEnv(process.env.CLAUDE_API_PORT, 5051, 'CLAUDE_API_PORT')
if (port < 1 || port > 65535) {
  throw new ValidationError('CLAUDE_API_PORT must be between 1 and 65535')
}

const timeoutSeconds = parseIntegerEnv(process.env.CLAUDE_API_TIMEOUT, 120, 'CLAUDE_API_TIMEOUT')
if (timeoutSeconds < 1) {
  throw new ValidationError('CLAUDE_API_TIMEOUT must be at least 1 second')
}

const startupCheckTimeoutSeconds = parseIntegerEnv(
  process.env.CLAUDE_API_STARTUP_CHECK_TIMEOUT,
  5,
  'CLAUDE_API_STARTUP_CHECK_TIMEOUT'
)
if (startupCheckTimeoutSeconds < 1) {
  throw new ValidationError('CLAUDE_API_STARTUP_CHECK_TIMEOUT must be at least 1 second')
}

const rateLimitWindowSeconds = parseIntegerEnv(
  process.env.CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS,
  60,
  'CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS'
)
if (rateLimitWindowSeconds < 1) {
  throw new ValidationError('CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS must be at least 1 second')
}

const rateLimitMaxRequests = parseIntegerEnv(
  process.env.CLAUDE_API_RATE_LIMIT_MAX_REQUESTS,
  0,
  'CLAUDE_API_RATE_LIMIT_MAX_REQUESTS'
)
if (rateLimitMaxRequests < 0) {
  throw new ValidationError('CLAUDE_API_RATE_LIMIT_MAX_REQUESTS must be 0 or greater')
}

const healthHistoryLimit = parseIntegerEnv(
  process.env.CLAUDE_API_HEALTH_HISTORY_LIMIT,
  25,
  'CLAUDE_API_HEALTH_HISTORY_LIMIT'
)
if (healthHistoryLimit < 1) {
  throw new ValidationError('CLAUDE_API_HEALTH_HISTORY_LIMIT must be at least 1')
}

const conversationTtlSeconds = parseIntegerEnv(
  process.env.CLAUDE_API_CONVERSATION_TTL_SECONDS,
  24 * 60 * 60,
  'CLAUDE_API_CONVERSATION_TTL_SECONDS'
)
if (conversationTtlSeconds < 1) {
  throw new ValidationError('CLAUDE_API_CONVERSATION_TTL_SECONDS must be at least 1 second')
}

const maxConversations = parseIntegerEnv(
  process.env.CLAUDE_API_MAX_CONVERSATIONS,
  1000,
  'CLAUDE_API_MAX_CONVERSATIONS'
)
if (maxConversations < 1) {
  throw new ValidationError('CLAUDE_API_MAX_CONVERSATIONS must be at least 1')
}

const contextWarnTokens = parseIntegerEnv(
  process.env.CLAUDE_API_CONTEXT_WARN_TOKENS,
  12_000,
  'CLAUDE_API_CONTEXT_WARN_TOKENS'
)
if (contextWarnTokens < 1) {
  throw new ValidationError('CLAUDE_API_CONTEXT_WARN_TOKENS must be at least 1')
}

const contextTargetTokens = parseIntegerEnv(
  process.env.CLAUDE_API_CONTEXT_TARGET_TOKENS,
  18_000,
  'CLAUDE_API_CONTEXT_TARGET_TOKENS'
)
if (contextTargetTokens < contextWarnTokens) {
  throw new ValidationError('CLAUDE_API_CONTEXT_TARGET_TOKENS must be greater than or equal to CLAUDE_API_CONTEXT_WARN_TOKENS')
}

const contextCompactKeepMessages = parseIntegerEnv(
  process.env.CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES,
  6,
  'CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES'
)
if (contextCompactKeepMessages < 2) {
  throw new ValidationError('CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES must be at least 2')
}

const contextSummaryMaxChars = parseIntegerEnv(
  process.env.CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS,
  2000,
  'CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS'
)
if (contextSummaryMaxChars < 200) {
  throw new ValidationError('CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS must be at least 200')
}

export const config = {
  host: process.env.CLAUDE_API_HOST || '127.0.0.1',
  port,
  timeoutMs: timeoutSeconds * 1000,
  startupCheckTimeoutMs: startupCheckTimeoutSeconds * 1000,
  rateLimitWindowMs: rateLimitWindowSeconds * 1000,
  rateLimitMaxRequests,
  healthHistoryLimit,
  conversationTtlMs: conversationTtlSeconds * 1000,
  maxConversations,
  contextWarnTokens,
  contextTargetTokens,
  contextCompactKeepMessages,
  contextSummaryMaxChars,
  isolateClaudeCwd: parseBooleanEnvWithDefault(process.env.CLAUDE_API_ISOLATE_CWD, true),
  claudeCwd: parseOptionalString(process.env.CLAUDE_API_CLAUDE_CWD) || join(tmpdir(), 'claude-empty-workdir'),
  bodyLimit: parseBodyLimit(process.env.CLAUDE_API_BODY_LIMIT),
  corsEnabled: parseBooleanEnv(process.env.CLAUDE_API_CORS),
  strictHealth: parseBooleanEnv(process.env.CLAUDE_API_STRICT_HEALTH),
  logLevel: parseLogLevel(process.env.CLAUDE_API_LOG_LEVEL),
  apiKey: parseApiKey(process.env.CLAUDE_API_KEY)
}

export const CLAUDE_SPAWN_ENV_BLOCKLIST = [
  'CLAUDECODE',
  'CLAUDE_CODE_ENTRYPOINT',
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'
]
