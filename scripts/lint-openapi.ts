import { readFileSync } from 'fs'
import { resolve } from 'path'
import YAML from 'yaml'

interface OpenApiDoc {
  openapi?: string
  info?: {
    title?: string
    version?: string
  }
  paths?: Record<string, Record<string, { summary?: string, responses?: Record<string, unknown> }>>
  components?: {
    schemas?: Record<string, unknown>
    securitySchemes?: Record<string, unknown>
  }
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head'])

function lintOpenApi(doc: OpenApiDoc): string[] {
  const issues: string[] = []

  if (!doc.openapi || !doc.openapi.startsWith('3.')) {
    issues.push('openapi field must be present and start with 3.x')
  }

  if (!doc.info?.title) {
    issues.push('info.title is required')
  }

  if (!doc.info?.version) {
    issues.push('info.version is required')
  }

  if (!doc.paths || Object.keys(doc.paths).length === 0) {
    issues.push('paths must contain at least one endpoint')
    return issues
  }

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    if (!path.startsWith('/')) {
      issues.push(`path must start with '/': ${path}`)
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      const normalizedMethod = method.toLowerCase()
      if (!HTTP_METHODS.has(normalizedMethod)) {
        continue
      }

      if (!operation.summary) {
        issues.push(`${normalizedMethod.toUpperCase()} ${path} is missing summary`)
      }

      if (!operation.responses || Object.keys(operation.responses).length === 0) {
        issues.push(`${normalizedMethod.toUpperCase()} ${path} must define responses`)
      }
    }
  }

  if (!doc.components?.schemas?.ErrorResponse) {
    issues.push('components.schemas.ErrorResponse is required')
  }

  if (!doc.components?.securitySchemes?.ApiKeyAuth) {
    issues.push('components.securitySchemes.ApiKeyAuth is required')
  }

  return issues
}

function main(): void {
  const openapiPath = resolve(process.cwd(), 'openapi.yaml')
  const doc = YAML.parse(readFileSync(openapiPath, 'utf8')) as OpenApiDoc
  const issues = lintOpenApi(doc)

  if (issues.length > 0) {
    console.error('OpenAPI lint failed:')
    for (const issue of issues) {
      console.error(`- ${issue}`)
    }
    process.exit(1)
  }

  console.log('OpenAPI lint passed')
}

main()
