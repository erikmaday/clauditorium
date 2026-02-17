import { spawn } from 'child_process'
import { config, CLAUDE_SPAWN_ENV_BLOCKLIST } from '../config/env'
import { log } from '../core/logger'
import { createCliError } from '../core/errors'

function buildClaudeSpawnEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }

  for (const key of CLAUDE_SPAWN_ENV_BLOCKLIST) {
    delete env[key]
  }

  return env
}

export function runClaude(prompt: string, requestId: string, model?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt]

    if (model) {
      args.push('--model', model)
    }

    log('INFO', `[${requestId}] Running Claude CLI (prompt length: ${prompt.length} chars${model ? `, model: ${model}` : ''})`)

    const spawnEnv = buildClaudeSpawnEnv()
    const strippedKeys = CLAUDE_SPAWN_ENV_BLOCKLIST.filter((key) => process.env[key] !== undefined)
    if (strippedKeys.length > 0) {
      log('DEBUG', `[${requestId}] Stripped inherited env vars before Claude spawn: ${strippedKeys.join(', ')}`)
    }

    const proc = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: spawnEnv
    })

    let stdout = ''
    let stderr = ''

    const timer = setTimeout(() => {
      proc.kill()
      log('ERROR', `[${requestId}] Request timed out after ${config.timeoutMs / 1000}s`)
      reject(createCliError(504, 'timeout', `Request timed out after ${config.timeoutMs / 1000} seconds`, requestId))
    }, config.timeoutMs)

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      clearTimeout(timer)

      if (code !== 0) {
        const errorMsg = stderr.trim() || 'Claude CLI returned non-zero exit code'
        log('ERROR', `[${requestId}] Claude CLI error: ${errorMsg}`)
        reject(createCliError(500, 'cli_error', errorMsg, requestId))
        return
      }

      const response = stdout.trim()
      log('INFO', `[${requestId}] Claude CLI response (length: ${response.length} chars)`)
      resolve(response)
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      log('ERROR', `[${requestId}] Failed to spawn Claude CLI: ${err.message}`)
      reject(createCliError(500, 'spawn_error', `Failed to spawn Claude CLI: ${err.message}`, requestId))
    })
  })
}
