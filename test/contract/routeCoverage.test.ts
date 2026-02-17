import listEndpoints from 'express-list-endpoints'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app'
import { getDocumentedOperations } from './openapi.helpers'

function getRuntimeOperations(): Set<string> {
  const app = createApp()
  const endpoints = listEndpoints(app)
  const operations = new Set<string>()

  for (const endpoint of endpoints) {
    for (const method of endpoint.methods) {
      if (method === 'OPTIONS' || method === 'HEAD') {
        continue
      }

      operations.add(`${method.toUpperCase()} ${endpoint.path}`)
    }
  }

  return operations
}

describe('OpenAPI route coverage', () => {
  it('documents every runtime route and only runtime routes', () => {
    const runtime = getRuntimeOperations()
    const documented = getDocumentedOperations()

    const undocumentedRuntime = [...runtime].filter((op) => !documented.has(op))
    const staleDocumented = [...documented].filter((op) => !runtime.has(op))

    expect(undocumentedRuntime).toEqual([])
    expect(staleDocumented).toEqual([])
  })
})
