import { describe, expect, it } from 'vitest'
import { createCliError, normalizeCliError, ValidationError } from '../../src/core/errors'

describe('ValidationError', () => {
  it('sets status and code fields', () => {
    const err = new ValidationError('bad input', { field: 'prompt' })

    expect(err.message).toBe('bad input')
    expect(err.status).toBe(400)
    expect(err.code).toBe('validation_error')
    expect(err.details).toEqual({ field: 'prompt' })
  })
})

describe('createCliError', () => {
  it('creates a normalized CLI error object', () => {
    expect(createCliError(504, 'timeout', 'Request timed out', 'abc12345')).toEqual({
      status: 504,
      error: 'timeout',
      message: 'Request timed out',
      request_id: 'abc12345'
    })
  })
})

describe('normalizeCliError', () => {
  it('returns known cli error unchanged', () => {
    const known = createCliError(500, 'cli_error', 'failed', 'rqid')
    expect(normalizeCliError(known, 'ignored')).toEqual(known)
  })

  it('normalizes unknown error shape', () => {
    expect(normalizeCliError(new Error('boom'), 'rqid')).toEqual({
      status: 500,
      error: 'unknown_error',
      message: 'An unknown error occurred',
      request_id: 'rqid'
    })
  })

  it('normalizes non-object values', () => {
    expect(normalizeCliError('oops', 'rqid')).toEqual({
      status: 500,
      error: 'unknown_error',
      message: 'An unknown error occurred',
      request_id: 'rqid'
    })
  })
})
