import { Request, Response, Router } from 'express'
import { getMetricsRegistry } from '../services/metrics'

const metricsRouter = Router()

metricsRouter.get('/', async (_req: Request, res: Response) => {
  const registry = getMetricsRegistry()
  res.setHeader('Content-Type', registry.contentType)
  res.send(await registry.metrics())
})

export { metricsRouter }
