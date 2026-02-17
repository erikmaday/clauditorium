import { createApp } from './app'
import { config } from './config/env'
import { VERSION } from './config/version'
import { log } from './core/logger'
import { checkClaudeCliReadiness } from './services/readiness'

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
  console.log(`  Host: ${config.host}`)
  console.log(`  Port: ${config.port}`)
  console.log(`  Timeout: ${config.timeoutMs / 1000}s`)
  console.log(`  CORS: ${config.corsEnabled ? 'enabled' : 'disabled'}`)
  console.log(`\nExample:`)
  console.log(`  curl -X POST http://${config.host}:${config.port}/ask \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"prompt": "Hello!"}'`)
  console.log(`\n${divider}\n`)
}

export function startServer(): void {
  const app = createApp()
  const readiness = checkClaudeCliReadiness()

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
}
