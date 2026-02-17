import { NextFunction, Request, Response } from 'express'
import { config } from '../config/env'

const requestsByIp = new Map<string, number[]>()

function getIpKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (config.rateLimitMaxRequests === 0) {
    next()
    return
  }

  const now = Date.now()
  const cutoff = now - config.rateLimitWindowMs
  const ipKey = getIpKey(req)
  const existing = requestsByIp.get(ipKey) || []
  const recent = existing.filter((timestamp) => timestamp >= cutoff)

  if (recent.length >= config.rateLimitMaxRequests) {
    const oldestInWindow = recent[0]
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + config.rateLimitWindowMs - now) / 1000))

    res.setHeader('Retry-After', String(retryAfterSeconds))
    res.status(429).json({
      error: 'rate_limited',
      message: `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
      retry_after_seconds: retryAfterSeconds,
      request_id: req.requestId
    })
    return
  }

  recent.push(now)
  requestsByIp.set(ipKey, recent)

  next()
}
