import { Router, Request, Response } from 'express'
import { runClaude } from '../clients/claudeCli'
import { normalizeCliError, ValidationError } from '../core/errors'
import { formatChatPrompt } from '../services/chatPrompt'
import { createConversation, getConversation, saveConversation } from '../services/conversationStore'
import { parseChatRequest } from './schemas'

const chatRouter = Router()

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = parseChatRequest(req.body)
    const existingConversation = body.conversationId ? getConversation(body.conversationId) : undefined
    if (body.conversationId && !existingConversation) {
      throw new ValidationError('conversation_id was not found')
    }

    const workingConversation = existingConversation
      ? {
          id: existingConversation.id,
          system: body.system ?? existingConversation.system,
          messages: [...existingConversation.messages]
        }
      : createConversation({ system: body.system, messages: [] })

    if (body.messages) {
      workingConversation.messages.push(...body.messages)
    }

    if (body.message) {
      workingConversation.messages.push({ role: 'user', content: body.message })
    }

    const prompt = formatChatPrompt(workingConversation.messages, workingConversation.system)
    const response = await runClaude(prompt, req.requestId!, body.model)
    workingConversation.messages.push({ role: 'assistant', content: response })
    saveConversation(workingConversation)

    res.json({
      success: true,
      conversation_id: workingConversation.id,
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
