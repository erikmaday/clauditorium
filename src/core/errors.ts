import { CliError } from '../types/api'

export class ValidationError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'ValidationError'
    this.status = 400
    this.code = 'validation_error'
    this.details = details
  }
}

export function createCliError(
  status: number,
  error: string,
  message: string,
  requestId: string
): CliError {
  return {
    status,
    error,
    message,
    request_id: requestId
  }
}

export function normalizeCliError(err: unknown, requestId: string): CliError {
  if (isCliError(err)) {
    return err
  }

  return createCliError(500, 'unknown_error', 'An unknown error occurred', requestId)
}

function isCliError(err: unknown): err is CliError {
  if (!err || typeof err !== 'object') {
    return false
  }

  return (
    'status' in err
    && 'error' in err
    && 'message' in err
    && 'request_id' in err
  )
}
