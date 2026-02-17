import { Router, Request, Response } from 'express'
import { config } from '../config/env'
import { VERSION } from '../config/version'

const versionRouter = Router()

versionRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    version: VERSION,
    timeout: config.timeoutMs / 1000,
    cors_enabled: config.corsEnabled
  })
})

export { versionRouter }
