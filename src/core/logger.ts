import { config } from '../config/env'
import pino from 'pino'

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR']
const PINO_LEVEL_BY_APP_LEVEL: Record<string, pino.Level> = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}
const logger = pino({
  level: PINO_LEVEL_BY_APP_LEVEL[config.logLevel] || 'info',
  base: {
    service: 'claude-api'
  },
  timestamp: pino.stdTimeFunctions.isoTime
}, {
  write: (chunk: string) => {
    console.log(chunk.trimEnd())
  }
})

function shouldLog(level: string): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(config.logLevel)
}

export interface LogContext {
  event?: string
  request_id?: string
  method?: string
  path?: string
  status_code?: number
  duration_ms?: number
  error_code?: string
  [key: string]: unknown
}

export function log(level: string, message: string, context: LogContext = {}): void {
  if (shouldLog(level)) {
    const pinoLevel = PINO_LEVEL_BY_APP_LEVEL[level] || 'info'
    logger[pinoLevel]({
      event: context.event || 'log',
      ...context,
      message
    })
  }
}
