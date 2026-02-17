import { describe, expect, it } from 'vitest'
import { askRouter } from '../../src/routes/ask'
import { chatRouter } from '../../src/routes/chat'
import { docsRouter } from '../../src/routes/docs'
import { healthRouter } from '../../src/routes/health'
import { modelsRouter } from '../../src/routes/models'
import { versionRouter } from '../../src/routes/version'
import { getDocumentedOperations } from './openapi.helpers'

const RUNTIME_UNDOCUMENTED_ALLOWLIST = new Set([
  'GET /docs',
  'GET /openapi.yaml'
])

function getRuntimeOperations(): Set<string> {
  const operations = new Set<string>()

  const mountedRouters = [
    { basePath: '/ask', router: askRouter },
    { basePath: '/chat', router: chatRouter },
    { basePath: '/health', router: healthRouter },
    { basePath: '/models', router: modelsRouter },
    { basePath: '/version', router: versionRouter },
    { basePath: '/', router: docsRouter }
  ]

  for (const mounted of mountedRouters) {
    const stack = (mounted.router as unknown as { stack?: Array<{ route?: { path: string, methods: Record<string, boolean> } }> }).stack || []
    for (const layer of stack) {
      const route = layer.route
      if (!route) {
        continue
      }

      const normalizedPath = `${mounted.basePath === '/' ? '' : mounted.basePath}${route.path === '/' ? '' : route.path}`
        .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
      for (const method of Object.keys(route.methods)) {
        if (method === 'options' || method === 'head') {
          continue
        }
        operations.add(`${method.toUpperCase()} ${normalizedPath}`)
      }
    }
  }

  return operations
}

describe('OpenAPI route coverage', () => {
  it('documents every runtime route and only runtime routes', () => {
    const runtime = getRuntimeOperations()
    const documented = getDocumentedOperations()

    const undocumentedRuntime = [...runtime].filter(
      (op) => !documented.has(op) && !RUNTIME_UNDOCUMENTED_ALLOWLIST.has(op)
    )
    const staleDocumented = [...documented].filter((op) => !runtime.has(op))

    expect(undocumentedRuntime).toEqual([])
    expect(staleDocumented).toEqual([])
  })
})
