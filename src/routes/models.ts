import { Router, Request, Response } from 'express'
import { normalizeCliError } from '../core/errors'
import { listAvailableModels } from '../services/models'

const modelsRouter = Router()

modelsRouter.get('/', (req: Request, res: Response) => {
  try {
    const models = listAvailableModels(req.requestId!)
    res.json({
      count: models.length,
      models
    })
  } catch (err) {
    const error = normalizeCliError(err, req.requestId!)
    res.status(error.status).json({
      error: error.error,
      message: error.message,
      request_id: error.request_id
    })
  }
})

export { modelsRouter }
