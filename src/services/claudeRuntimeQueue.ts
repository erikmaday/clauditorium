import { config } from '../config/env'
import { createCliError } from '../core/errors'
import { log } from '../core/logger'

interface QueueTask<T> {
  requestId: string
  task: () => Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
  timeout: NodeJS.Timeout
}

interface ClaudeRuntimeStats {
  active_requests: number
  queued_requests: number
  max_concurrent: number
  max_queue: number
  rejected_total: number
  queue_timeouts_total: number
}

const queue: Array<QueueTask<unknown>> = []
let activeRequests = 0
let rejectedTotal = 0
let queueTimeoutsTotal = 0

function getStats(): ClaudeRuntimeStats {
  return {
    active_requests: activeRequests,
    queued_requests: queue.length,
    max_concurrent: config.maxConcurrentClaudeRequests,
    max_queue: config.maxClaudeQueueSize,
    rejected_total: rejectedTotal,
    queue_timeouts_total: queueTimeoutsTotal
  }
}

function removeFromQueue(task: QueueTask<unknown>): boolean {
  const index = queue.indexOf(task)
  if (index === -1) {
    return false
  }

  queue.splice(index, 1)
  return true
}

function startQueuedTask(task: QueueTask<unknown>): void {
  clearTimeout(task.timeout)
  activeRequests += 1
  log('DEBUG', `[${task.requestId}] Starting queued Claude request (active=${activeRequests}, queued=${queue.length})`)

  Promise.resolve()
    .then(task.task)
    .then(task.resolve, task.reject)
    .finally(() => {
      activeRequests = Math.max(0, activeRequests - 1)
      drainQueue()
    })
}

function drainQueue(): void {
  while (activeRequests < config.maxConcurrentClaudeRequests && queue.length > 0) {
    const next = queue.shift()
    if (!next) {
      break
    }
    startQueuedTask(next)
  }
}

export function enqueueClaudeTask<T>(requestId: string, task: () => Promise<T>): Promise<T> {
  if (activeRequests < config.maxConcurrentClaudeRequests) {
    activeRequests += 1
    log('DEBUG', `[${requestId}] Starting Claude request immediately (active=${activeRequests}, queued=${queue.length})`)
    return Promise.resolve()
      .then(task)
      .finally(() => {
        activeRequests = Math.max(0, activeRequests - 1)
        drainQueue()
      })
  }

  if (queue.length >= config.maxClaudeQueueSize) {
    rejectedTotal += 1
    log('WARN', `[${requestId}] Claude queue full; rejecting request (active=${activeRequests}, queued=${queue.length})`)
    return Promise.reject(
      createCliError(429, 'concurrency_limited', 'Claude runtime is busy. Please retry shortly.', requestId)
    )
  }

  return new Promise<T>((resolve, reject) => {
    const queued: QueueTask<T> = {
      requestId,
      task,
      resolve,
      reject,
      timeout: setTimeout(() => {
        const removed = removeFromQueue(queued as QueueTask<unknown>)
        if (!removed) {
          return
        }

        queueTimeoutsTotal += 1
        log('WARN', `[${requestId}] Claude queue wait timed out (active=${activeRequests}, queued=${queue.length})`)
        reject(
          createCliError(
            504,
            'queue_timeout',
            `Claude runtime queue wait exceeded ${config.claudeQueueTimeoutMs}ms`,
            requestId
          )
        )
      }, config.claudeQueueTimeoutMs)
    }

    queue.push(queued as QueueTask<unknown>)
    log('DEBUG', `[${requestId}] Queued Claude request (active=${activeRequests}, queued=${queue.length})`)
  })
}

export function getClaudeRuntimeStats(): ClaudeRuntimeStats {
  return getStats()
}

export function clearClaudeRuntimeQueueForTests(): void {
  for (const queued of queue) {
    clearTimeout(queued.timeout)
  }
  queue.length = 0
  activeRequests = 0
  rejectedTotal = 0
  queueTimeoutsTotal = 0
}
