import { Request, Response } from 'express'

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'not_found',
    message: 'Route not found',
    request_id: req.requestId
  })
}
