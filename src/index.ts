#!/usr/bin/env node
/**
 * Claude API Server - Wraps Claude CLI (OAuth) as a REST API
 *
 * A lightweight Express server that exposes Claude's capabilities via HTTP endpoints.
 * Requires the Claude CLI to be installed and authenticated on the host machine.
 */

import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import cors from 'cors'
import express, { Request, Response, NextFunction } from 'express'

const VERSION = '1.0.0'

// Configuration from environment variables
const HOST = process.env.CLAUDE_API_HOST || '127.0.0.1'
const PORT = parseInt(process.env.CLAUDE_API_PORT || '5051', 10)
const TIMEOUT = parseInt(process.env.CLAUDE_API_TIMEOUT || '120', 10) * 1000
const ENABLE_CORS = process.env.CLAUDE_API_CORS?.toLowerCase() === 'true'
const LOG_LEVEL = process.env.CLAUDE_API_LOG_LEVEL?.toUpperCase() || 'INFO'
const CLAUDE_SPAWN_ENV_BLOCKLIST = [
  'CLAUDECODE',
  'CLAUDE_CODE_ENTRYPOINT',
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
]

// Types
interface Message {
  role: string
  content: string
}

interface AskRequest {
  prompt: string
  model?: string
}

interface ChatRequest {
  messages: Message[]
  system?: string
  model?: string
}

interface RequestWithId extends Request {
  requestId?: string
}

interface CliError {
  status: number
  error: string
  message: string
  request_id: string
}

// Logger
const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR']

function shouldLog(level: string): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(LOG_LEVEL)
}

function log(level: string, message: string): void {
  if (shouldLog(level)) {
    console.log(`${new Date().toISOString()} - claude-api - ${level} - ${message}`)
  }
}

function buildClaudeSpawnEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const key of CLAUDE_SPAWN_ENV_BLOCKLIST) {
    delete env[key]
  }
  return env
}

// Run Claude CLI
function runClaude(prompt: string, requestId: string, model?: string): Promise<string> {
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
      log('ERROR', `[${requestId}] Request timed out after ${TIMEOUT / 1000}s`)
      reject({
        status: 504,
        error: 'timeout',
        message: `Request timed out after ${TIMEOUT / 1000} seconds`,
        request_id: requestId
      })
    }, TIMEOUT)

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
        reject({
          status: 500,
          error: 'cli_error',
          message: errorMsg,
          request_id: requestId
        })
        return
      }

      const response = stdout.trim()
      log('INFO', `[${requestId}] Claude CLI response (length: ${response.length} chars)`)
      resolve(response)
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      log('ERROR', `[${requestId}] Failed to spawn Claude CLI: ${err.message}`)
      reject({
        status: 500,
        error: 'spawn_error',
        message: `Failed to spawn Claude CLI: ${err.message}`,
        request_id: requestId
      })
    })
  })
}

// Format chat messages into a prompt string
function formatChatPrompt(messages: Message[], system?: string): string {
  const parts: string[] = []

  if (system) {
    parts.push(`System: ${system}\n`)
  }

  for (const msg of messages) {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
    parts.push(`${role}: ${msg.content}`)
  }

  return parts.join('\n')
}

// Create Express app
const app = express()

app.use(express.json())

if (ENABLE_CORS) {
  app.use(cors())
}

// Request ID middleware
app.use((req: RequestWithId, _res: Response, next: NextFunction) => {
  const requestId = randomUUID().slice(0, 8)
  req.requestId = requestId
  _res.setHeader('X-Request-ID', requestId)
  log('DEBUG', `[${requestId}] ${req.method} ${req.path}`)
  next()
})

// POST /ask - Simple prompt/response
app.post('/ask', async (req: RequestWithId, res: Response) => {
  const body = req.body as AskRequest

  if (!body.prompt) {
    res.status(400).json({
      error: 'validation_error',
      message: 'prompt is required',
      request_id: req.requestId
    })
    return
  }

  try {
    const response = await runClaude(body.prompt, req.requestId!, body.model)
    res.json({ success: true, response })
  } catch (err) {
    const error = err as CliError
    res.status(error.status || 500).json({
      error: error.error || 'unknown_error',
      message: error.message || 'An unknown error occurred',
      request_id: req.requestId
    })
  }
})

// POST /chat - Chat with message history
app.post('/chat', async (req: RequestWithId, res: Response) => {
  const body = req.body as ChatRequest

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({
      error: 'validation_error',
      message: 'messages array is required and must not be empty',
      request_id: req.requestId
    })
    return
  }

  const prompt = formatChatPrompt(body.messages, body.system)

  try {
    const response = await runClaude(prompt, req.requestId!, body.model)
    res.json({
      success: true,
      message: { role: 'assistant', content: response }
    })
  } catch (err) {
    const error = err as CliError
    res.status(error.status || 500).json({
      error: error.error || 'unknown_error',
      message: error.message || 'An unknown error occurred',
      request_id: req.requestId
    })
  }
})

// GET /health - Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// GET /version - Version info
app.get('/version', (_req: Request, res: Response) => {
  res.json({
    version: VERSION,
    timeout: TIMEOUT / 1000,
    cors_enabled: ENABLE_CORS
  })
})

// Print startup banner
function printBanner(): void {
  const divider = '='.repeat(50)
  console.log(`\n${divider}`)
  console.log(`  Claude API Server v${VERSION}`)
  console.log(divider)
  console.log(`\nEndpoints:`)
  console.log(`  POST /ask     - Simple prompt/response`)
  console.log(`  POST /chat    - Chat with message history`)
  console.log(`  GET  /health  - Health check`)
  console.log(`  GET  /version - API version info`)
  console.log(`\nConfiguration:`)
  console.log(`  Host: ${HOST}`)
  console.log(`  Port: ${PORT}`)
  console.log(`  Timeout: ${TIMEOUT / 1000}s`)
  console.log(`  CORS: ${ENABLE_CORS ? 'enabled' : 'disabled'}`)
  console.log(`\nExample:`)
  console.log(`  curl -X POST http://${HOST}:${PORT}/ask \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"prompt": "Hello!"}'`)
  console.log(`\n${divider}\n`)
}

// Start server
function startServer(): void {
  printBanner()

  app.listen(PORT, HOST, () => {
    log('INFO', `Claude API Server v${VERSION} starting...`)
    log('INFO', `Host: ${HOST}, Port: ${PORT}, Timeout: ${TIMEOUT / 1000}s`)
    log('INFO', `CORS: ${ENABLE_CORS ? 'enabled' : 'disabled'}`)
    log('INFO', `Server listening on http://${HOST}:${PORT}`)
  })
}

startServer()
