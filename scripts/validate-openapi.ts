import SwaggerParser from '@apidevtools/swagger-parser'

async function main(): Promise<void> {
  await SwaggerParser.validate('openapi.yaml')
  console.log('OpenAPI validation passed')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown OpenAPI validation error'
  console.error(message)
  process.exit(1)
})
