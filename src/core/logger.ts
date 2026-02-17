import { config } from '../config/env'

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR']

function shouldLog(level: string): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(config.logLevel)
}

export function log(level: string, message: string): void {
  if (shouldLog(level)) {
    console.log(`${new Date().toISOString()} - claude-api - ${level} - ${message}`)
  }
}
