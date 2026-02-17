import cors from 'cors'
import express from 'express'
import { config } from './config/env'
import { apiKeyMiddleware } from './middleware/apiKey'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { requestIdMiddleware } from './middleware/requestId'
import { requestTimingMiddleware } from './middleware/requestTiming'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFound'
import { askRouter } from './routes/ask'
import { chatRouter } from './routes/chat'
import { docsRouter } from './routes/docs'
import { healthRouter } from './routes/health'
import { metricsRouter } from './routes/metrics'
import { modelsRouter } from './routes/models'
import { versionRouter } from './routes/version'

export function createApp() {
  const app = express()

  app.use(requestIdMiddleware)
  app.use(requestTimingMiddleware)

  if (config.corsEnabled) {
    app.use(cors())
  }

  app.use(express.json({ limit: config.bodyLimit }))

  app.use('/health', healthRouter)
  app.use('/metrics', metricsRouter)
  app.use('/models', modelsRouter)
  app.use('/version', versionRouter)
  app.use('/', docsRouter)
  app.use('/ask', apiKeyMiddleware, rateLimitMiddleware, askRouter)
  app.use('/chat', apiKeyMiddleware, rateLimitMiddleware, chatRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
