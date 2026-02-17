import { Router, Request, Response } from 'express'
import { config } from '../config/env'
import { VERSION } from '../config/version'
import { VersionResponse } from '../types/api'

const versionRouter = Router()

versionRouter.get('/', (_req: Request, res: Response<VersionResponse>) => {
  const payload: VersionResponse = {
    version: VERSION,
    timeout: config.timeoutMs / 1000,
    cors_enabled: config.corsEnabled
  }
  res.json(payload)
})

export { versionRouter }
