import cors from 'cors'
import express from 'express'
import { config } from './config/env'
import { apiKeyMiddleware } from './middleware/apiKey'
import { requestIdMiddleware } from './middleware/requestId'
import { requestTimingMiddleware } from './middleware/requestTiming'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFound'
import { askRouter } from './routes/ask'
import { chatRouter } from './routes/chat'
import { healthRouter } from './routes/health'
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
  app.use('/version', versionRouter)
  app.use('/ask', apiKeyMiddleware, askRouter)
  app.use('/chat', apiKeyMiddleware, chatRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
