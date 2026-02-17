import { NextFunction, Request, Response } from 'express'
import { log } from '../core/logger'

export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000
    const requestId = req.requestId || 'unknown'
    log('INFO', `[${requestId}] Completed ${req.method} ${req.originalUrl} ${res.statusCode} in ${durationMs.toFixed(1)}ms`)
  })

  next()
}
