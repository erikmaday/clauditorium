import { Router, Request, Response } from 'express'
import { config } from '../config/env'
import { getClaudeCliReadiness } from '../services/readiness'

const healthRouter = Router()

healthRouter.get('/', (_req: Request, res: Response) => {
  const readiness = getClaudeCliReadiness()
  const strictFailure = config.strictHealth && readiness.status === 'not_ready'
  const healthStatus = readiness.status === 'not_ready' ? 'degraded' : 'ok'

  res.status(strictFailure ? 503 : 200).json({
    status: healthStatus,
    strict_mode: config.strictHealth,
    readiness: {
      claude_cli: readiness
    }
  })
})

export { healthRouter }
