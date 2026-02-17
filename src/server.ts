import { createApp } from './app'
import { config } from './config/env'
import { VERSION } from './config/version'
import { log } from './core/logger'
import { checkClaudeCliReadiness } from './services/readiness'
import { startDrainMode, waitForClaudeDrain } from './services/shutdown'

function printBanner(): void {
  const divider = '='.repeat(50)
  console.log(`\n${divider}`)
  console.log(`  Claude API Server v${VERSION}`)
  console.log(divider)
  console.log(`\nEndpoints:`)
  console.log(`  POST /ask     - Simple prompt/response`)
  console.log(`  POST /chat    - Chat with persistent context`)
  console.log(`  DELETE /chat/:conversation_id - Delete stored conversation`)
  console.log(`  GET  /models  - Available Claude models`)
  console.log(`  GET  /health  - Health check`)
  console.log(`  GET  /health/history - Readiness check history`)
  console.log(`  POST /health/recheck - Re-run readiness check (API key required)`)
  console.log(`  GET  /metrics - Prometheus metrics`)
  console.log(`  GET  /version - API version info`)
  console.log(`\nConfiguration:`)
  console.log(`  Host: ${config.host}`)
  console.log(`  Port: ${config.port}`)
  console.log(`  Timeout: ${config.timeoutMs / 1000}s`)
  console.log(`  CORS: ${config.corsEnabled ? 'enabled' : 'disabled'}`)
  console.log(`  Drain timeout: ${config.shutdownDrainTimeoutMs / 1000}s`)
  console.log(`\nExample:`)
  console.log(`  curl -X POST http://${config.host}:${config.port}/ask \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"prompt": "Hello!"}'`)
  console.log(`\n${divider}\n`)
}

export function startServer(): void {
  const app = createApp()
  const readiness = checkClaudeCliReadiness()
  let isShuttingDown = false

  printBanner()

  if (readiness.status === 'ready') {
    log('INFO', `Claude CLI readiness check passed (${readiness.version || 'unknown version'})`)
  } else {
    log('WARN', `Claude CLI readiness check failed: ${readiness.error || 'unknown error'}`)
  }

  const server = app.listen(config.port, config.host, () => {
    log('INFO', `Claude API Server v${VERSION} starting...`)
    log('INFO', `Host: ${config.host}, Port: ${config.port}, Timeout: ${config.timeoutMs / 1000}s`)
    log('INFO', `CORS: ${config.corsEnabled ? 'enabled' : 'disabled'}`)
    log('INFO', `Server listening on http://${config.host}:${config.port}`)
  })

  server.on('error', (err: Error) => {
    log('ERROR', `Failed to start server: ${err.message}`)
    process.exit(1)
  })

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      log('WARN', `Received ${signal} while shutdown is already in progress`)
      return
    }
    isShuttingDown = true

    startDrainMode(signal)
    log('INFO', 'Starting graceful shutdown drain', {
      event: 'shutdown_start',
      signal,
      drain_timeout_ms: config.shutdownDrainTimeoutMs
    })

    const drained = await waitForClaudeDrain(config.shutdownDrainTimeoutMs)

    await new Promise<void>((resolve) => {
      server.close((err?: Error) => {
        if (err) {
          log('ERROR', `Error while closing HTTP server: ${err.message}`, {
            event: 'shutdown_http_close_error',
            signal
          })
        }
        resolve()
      })
    })

    if (drained) {
      log('INFO', 'Graceful shutdown completed', {
        event: 'shutdown_complete',
        signal
      })
      process.exit(0)
      return
    }

    log('WARN', 'Graceful shutdown drain timed out; exiting with failure', {
      event: 'shutdown_timeout',
      signal,
      drain_timeout_ms: config.shutdownDrainTimeoutMs
    })
    process.exit(1)
  }

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })
  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })
}
