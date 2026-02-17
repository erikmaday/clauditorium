import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Router, Request, Response } from 'express'

const docsRouter = Router()

function getOpenApiPath(): string {
  return resolve(__dirname, '../../openapi.yaml')
}

function buildDocsHtml(specUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Clauditorium API Docs</title>
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <redoc spec-url="${specUrl}"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`
}

docsRouter.get('/openapi.yaml', (_req: Request, res: Response) => {
  try {
    const spec = readFileSync(getOpenApiPath(), 'utf8')
    res.type('application/yaml').send(spec)
  } catch {
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to load OpenAPI spec',
      request_id: _req.requestId
    })
  }
})

docsRouter.get('/docs', (req: Request, res: Response) => {
  const host = req.get('host') || '127.0.0.1:5051'
  const protocol = req.protocol || 'http'
  const specUrl = `${protocol}://${host}/openapi.yaml`

  res.type('html').send(buildDocsHtml(specUrl))
})

export { docsRouter }
