import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { log } from '../core/logger'

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID().slice(0, 8)
  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  log('DEBUG', `[${requestId}] ${req.method} ${req.path}`)
  next()
}
