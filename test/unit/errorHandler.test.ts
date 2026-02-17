import { describe, expect, it, vi } from 'vitest'
import { NextFunction, Request, Response } from 'express'
import { errorHandler } from '../../src/middleware/errorHandler'
import { ValidationError } from '../../src/core/errors'

function createMockRes() {
  const payload: { status?: number, body?: unknown } = {}

  const res = {
    status: vi.fn((status: number) => {
      payload.status = status
      return res
    }),
    json: vi.fn((body: unknown) => {
      payload.body = body
      return res
    })
  }

  return { res, payload }
}

describe('errorHandler', () => {
  it('returns 400 for validation errors', () => {
    const { res, payload } = createMockRes()
    const req = { requestId: 'abcd1234' } as unknown as Request

    errorHandler(new ValidationError('bad request'), req, res as unknown as Response, vi.fn() as NextFunction)

    expect(payload.status).toBe(400)
    expect(payload.body).toEqual({
      error: 'validation_error',
      message: 'bad request',
      details: undefined,
      request_id: 'abcd1234'
    })
  })

  it('returns 500 for unknown errors', () => {
    const { res, payload } = createMockRes()
    const req = { requestId: 'abcd1234' } as unknown as Request

    errorHandler(new Error('boom'), req, res as unknown as Response, vi.fn() as NextFunction)

    expect(payload.status).toBe(500)
    expect(payload.body).toEqual({
      error: 'internal_error',
      message: 'Internal server error',
      request_id: 'abcd1234'
    })
  })
})
