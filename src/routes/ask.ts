import { Router, Request, Response } from 'express'
import { runClaude } from '../clients/claudeCli'
import { normalizeCliError, ValidationError } from '../core/errors'
import { parseAskRequest } from './schemas'

const askRouter = Router()

askRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = parseAskRequest(req.body)
    const response = await runClaude(body.prompt, req.requestId!, body.model)
    res.json({ success: true, response })
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(err.status).json({
        error: err.code,
        message: err.message,
        details: err.details,
        request_id: req.requestId
      })
      return
    }

    const error = normalizeCliError(err, req.requestId!)
    res.status(error.status).json({
      error: error.error,
      message: error.message,
      request_id: error.request_id
    })
  }
})

export { askRouter }
