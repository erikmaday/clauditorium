import cors from 'cors'
import express from 'express'
import { config } from './config/env'
import { requestIdMiddleware } from './middleware/requestId'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFound'
import { askRouter } from './routes/ask'
import { chatRouter } from './routes/chat'
import { healthRouter } from './routes/health'
import { versionRouter } from './routes/version'

export function createApp() {
  const app = express()

  app.use(express.json())

  if (config.corsEnabled) {
    app.use(cors())
  }

  app.use(requestIdMiddleware)

  app.use('/ask', askRouter)
  app.use('/chat', chatRouter)
  app.use('/health', healthRouter)
  app.use('/version', versionRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
