import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'

const rootOpenapiPath = resolve(process.cwd(), 'openapi.yaml')
const docsOpenapiPath = resolve(process.cwd(), 'docs-site/public/openapi.yaml')
const checkOnly = process.argv.includes('--check')

const rootOpenapi = readFileSync(rootOpenapiPath, 'utf8')
const docsExists = existsSync(docsOpenapiPath)
const docsOpenapi = docsExists ? readFileSync(docsOpenapiPath, 'utf8') : ''

if (checkOnly) {
  if (!docsExists || docsOpenapi !== rootOpenapi) {
    console.error('docs-site/public/openapi.yaml is out of sync with root openapi.yaml')
    process.exit(1)
  }

  console.log('Docs OpenAPI sync check passed')
  process.exit(0)
}

mkdirSync(dirname(docsOpenapiPath), { recursive: true })
writeFileSync(docsOpenapiPath, rootOpenapi)
console.log('Synced openapi.yaml to docs-site/public/openapi.yaml')
