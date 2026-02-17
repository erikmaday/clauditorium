import { Router, Request, Response } from 'express'
import { normalizeCliError } from '../core/errors'
import { listAvailableModels } from '../services/models'
import { ApiErrorResponse, ModelsResponse } from '../types/api'

const modelsRouter = Router()

modelsRouter.get('/', (req: Request, res: Response<ModelsResponse | ApiErrorResponse>) => {
  try {
    const models = listAvailableModels(req.requestId!)
    const payload: ModelsResponse = {
      count: models.length,
      models
    }
    res.json(payload)
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
