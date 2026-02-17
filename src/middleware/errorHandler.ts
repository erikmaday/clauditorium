import { NextFunction, Request, Response } from 'express'
import { ValidationError } from '../core/errors'
import { log } from '../core/logger'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || 'unknown'

  if (err instanceof ValidationError) {
    res.status(400).json({
      error: err.code,
      message: err.message,
      details: err.details,
      request_id: requestId
    })
    return
  }

  const message = err instanceof Error ? err.message : 'Internal server error'
  log('ERROR', `[${requestId}] Unhandled server error: ${message}`)

  res.status(500).json({
    error: 'internal_error',
    message: 'Internal server error',
    request_id: requestId
  })
}
