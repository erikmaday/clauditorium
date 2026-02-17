import { NextFunction, Request, Response } from 'express'
import { isDraining } from '../services/shutdown'

export function rejectDuringDrainMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!isDraining()) {
    next()
    return
  }

  res.status(503).json({
    error: 'shutting_down',
    message: 'Service is draining and not accepting new Claude requests',
    request_id: req.requestId
  })
}
