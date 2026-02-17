import { readFileSync } from 'fs'
import { resolve } from 'path'
import YAML from 'yaml'
import OpenAPIResponseValidator from 'openapi-response-validator'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

interface OpenApiDoc {
  paths: Record<string, Record<string, { responses: Record<string, unknown> }>>
  components?: Record<string, unknown>
}

let cachedDoc: OpenApiDoc | null = null

export function loadOpenApiDoc(): OpenApiDoc {
  if (cachedDoc) {
    return cachedDoc
  }

  const openapiPath = resolve(process.cwd(), 'openapi.yaml')
  const parsed = YAML.parse(readFileSync(openapiPath, 'utf8')) as OpenApiDoc
  cachedDoc = parsed
  return parsed
}

export function getDocumentedOperations(): Set<string> {
  const doc = loadOpenApiDoc()
  const operations = new Set<string>()

  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const method of Object.keys(methods)) {
      const normalized = method.toLowerCase()
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(normalized)) {
        operations.add(`${normalized.toUpperCase()} ${path}`)
      }
    }
  }

  return operations
}

export function validateOpenApiResponse(
  path: string,
  method: HttpMethod,
  status: number,
  responseBody: unknown
): { message: string } | undefined {
  const doc = loadOpenApiDoc()
  const operation = doc.paths[path]?.[method]

  if (!operation) {
    throw new Error(`Operation not found in OpenAPI: ${method.toUpperCase()} ${path}`)
  }

  const validator = new OpenAPIResponseValidator({
    responses: operation.responses,
    components: doc.components
  })

  const result = validator.validateResponse(status, responseBody)
  if (!result) {
    return undefined
  }

  return {
    message: JSON.stringify(result.errors || result, null, 2)
  }
}
