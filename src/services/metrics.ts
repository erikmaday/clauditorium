import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics
} from 'prom-client'

const registry = new Registry()
collectDefaultMetrics({ register: registry })

const httpRequestsTotal = new Counter({
  name: 'clauditorium_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry]
})

const httpRequestDurationMs = new Histogram({
  name: 'clauditorium_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [registry]
})

const claudeRuntimeActiveRequests = new Gauge({
  name: 'clauditorium_claude_runtime_active_requests',
  help: 'Current number of active Claude runtime requests',
  registers: [registry]
})

const claudeRuntimeQueuedRequests = new Gauge({
  name: 'clauditorium_claude_runtime_queued_requests',
  help: 'Current number of queued Claude runtime requests',
  registers: [registry]
})

const claudeRuntimeRejectedTotal = new Counter({
  name: 'clauditorium_claude_runtime_rejected_total',
  help: 'Total number of Claude runtime requests rejected due to queue saturation',
  registers: [registry]
})

const claudeRuntimeQueueTimeoutsTotal = new Counter({
  name: 'clauditorium_claude_runtime_queue_timeouts_total',
  help: 'Total number of Claude runtime queue wait timeouts',
  registers: [registry]
})

export function normalizeRouteLabel(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

export function observeHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number
): void {
  const labels = {
    method: method.toUpperCase(),
    route,
    status_code: String(statusCode)
  }
  httpRequestsTotal.inc(labels)
  httpRequestDurationMs.observe(labels, durationMs)
}

export function setClaudeRuntimeState(activeRequests: number, queuedRequests: number): void {
  claudeRuntimeActiveRequests.set(activeRequests)
  claudeRuntimeQueuedRequests.set(queuedRequests)
}

export function incrementClaudeRuntimeRejected(): void {
  claudeRuntimeRejectedTotal.inc()
}

export function incrementClaudeRuntimeQueueTimeouts(): void {
  claudeRuntimeQueueTimeoutsTotal.inc()
}

export function getMetricsRegistry(): Registry {
  return registry
}
