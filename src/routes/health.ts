import { Router, Request, Response } from 'express'

const healthRouter = Router()

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

export { healthRouter }
