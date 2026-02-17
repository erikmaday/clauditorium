import { NextFunction, Request, Response } from 'express'
import { log } from '../core/logger'
import { normalizeRouteLabel, observeHttpRequest } from '../services/metrics'

function getRouteLabel(req: Request): string {
  const routePathValue = (req.route as { path?: unknown } | undefined)?.path
  if (typeof routePathValue === 'string') {
    const base = req.baseUrl || ''
    const suffix = routePathValue === '/' ? '' : routePathValue
    const fullPath = `${base}${suffix}` || '/'
    return normalizeRouteLabel(fullPath)
  }

  return 'unmatched'
}

export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000
    const route = getRouteLabel(req)
    observeHttpRequest(req.method, route, res.statusCode, durationMs)
    log('INFO', 'Request completed', {
      event: 'http_request_completed',
      request_id: req.requestId || 'unknown',
      method: req.method,
      path: route,
      status_code: res.statusCode,
      duration_ms: Number(durationMs.toFixed(1))
    })
  })

  next()
}
