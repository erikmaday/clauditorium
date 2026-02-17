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
