import { NextFunction, Request, Response } from 'express'
import { config } from '../config/env'

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!config.apiKey) {
    next()
    return
  }

  const provided = req.header('x-api-key')

  if (provided !== config.apiKey) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or missing API key',
      request_id: req.requestId
    })
    return
  }

  next()
}

export function strictApiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!config.apiKey) {
    res.status(503).json({
      error: 'api_key_not_configured',
      message: 'CLAUDE_API_KEY is required for this endpoint',
      request_id: req.requestId
    })
    return
  }

  const provided = req.header('x-api-key')

  if (provided !== config.apiKey) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or missing API key',
      request_id: req.requestId
    })
    return
  }

  next()
}
