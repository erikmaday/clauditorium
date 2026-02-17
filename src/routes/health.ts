import { Router, Request, Response } from 'express'
import { config } from '../config/env'
import { strictApiKeyMiddleware } from '../middleware/apiKey'
import {
  checkClaudeCliReadiness,
  getClaudeCliReadiness,
  getClaudeCliReadinessHistory,
  getProcessObservability
} from '../services/readiness'

const healthRouter = Router()

function buildHealthResponse(): { statusCode: number, payload: unknown } {
  const readiness = getClaudeCliReadiness()
  const strictFailure = config.strictHealth && readiness.status === 'not_ready'
  const healthStatus = readiness.status === 'not_ready' ? 'degraded' : 'ok'

  return {
    statusCode: strictFailure ? 503 : 200,
    payload: {
      status: healthStatus,
      strict_mode: config.strictHealth,
      observability: getProcessObservability(),
      readiness: {
        claude_cli: readiness
      }
    }
  }
}

healthRouter.get('/', (_req: Request, res: Response) => {
  const { statusCode, payload } = buildHealthResponse()
  res.status(statusCode).json(payload)
})

healthRouter.post('/recheck', strictApiKeyMiddleware, (_req: Request, res: Response) => {
  checkClaudeCliReadiness()
  const { statusCode, payload } = buildHealthResponse()
  res.status(statusCode).json(payload)
})

healthRouter.get('/history', (_req: Request, res: Response) => {
  res.json({
    observability: getProcessObservability(),
    history: getClaudeCliReadinessHistory()
  })
})

export { healthRouter }
