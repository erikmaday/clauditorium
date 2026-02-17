import { Router, Request, Response } from 'express'
import { runClaude } from '../clients/claudeCli'
import { normalizeCliError, ValidationError } from '../core/errors'
import { formatChatPrompt } from '../services/chatPrompt'
import { parseChatRequest } from './schemas'

const chatRouter = Router()

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = parseChatRequest(req.body)
    const prompt = formatChatPrompt(body.messages, body.system)
    const response = await runClaude(prompt, req.requestId!, body.model)
    res.json({
      success: true,
      message: { role: 'assistant', content: response }
    })
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

export { chatRouter }
