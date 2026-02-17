import { NextFunction, Request, Response } from 'express'
import { ValidationError } from '../core/errors'
import { config } from '../config/env'
import { log } from '../core/logger'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || 'unknown'

  if (isPayloadTooLargeError(err)) {
    res.status(413).json({
      error: 'payload_too_large',
      message: `Request body exceeds limit of ${config.bodyLimit}`,
      request_id: requestId
    })
    return
  }

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
  log('ERROR', 'Unhandled server error', {
    event: 'unhandled_error',
    request_id: requestId,
    error_code: 'internal_error',
    message
  })

  res.status(500).json({
    error: 'internal_error',
    message: 'Internal server error',
    request_id: requestId
  })
}

function isPayloadTooLargeError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false
  }

  const maybeErr = err as { status?: unknown, type?: unknown }
  return maybeErr.status === 413 || maybeErr.type === 'entity.too.large'
}
