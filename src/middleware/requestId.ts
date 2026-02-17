import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { log } from '../core/logger'

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID().slice(0, 8)
  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  log('DEBUG', 'Request started', {
    event: 'http_request_started',
    request_id: requestId,
    method: req.method,
    path: req.path
  })
  next()
}
