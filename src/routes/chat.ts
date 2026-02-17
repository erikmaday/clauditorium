import { Router, Request, Response } from 'express'
import { runClaude } from '../clients/claudeCli'
import { normalizeCliError, ValidationError } from '../core/errors'
import { config } from '../config/env'
import { formatChatPrompt } from '../services/chatPrompt'
import {
  ConversationState,
  createConversation,
  deleteConversation,
  getConversation,
  saveConversation
} from '../services/conversationStore'
import { parseChatRequest } from './schemas'

const chatRouter = Router()

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = parseChatRequest(req.body)
    let workingConversation: ConversationState

    if (body.conversationId) {
      const existingConversation = getConversation(body.conversationId)
      if (!existingConversation) {
        throw new ValidationError('conversation_id was not found')
      }

      workingConversation = {
        ...existingConversation,
        messages: [...existingConversation.messages]
      }
      workingConversation.messages.push({ role: 'user', content: body.message })
    } else {
      workingConversation = createConversation({
        system: body.system,
        message: { role: 'user', content: body.message }
      })
    }

    const prompt = formatChatPrompt(workingConversation.messages, workingConversation.system)
    const response = await runClaude(prompt, req.requestId!, body.model)
    workingConversation.messages.push({ role: 'assistant', content: response })
    saveConversation(workingConversation)

    res.json({
      success: true,
      conversation_id: workingConversation.id,
      message: { role: 'assistant', content: response },
      conversation: {
        id: workingConversation.id,
        created_at: workingConversation.createdAt,
        updated_at: workingConversation.updatedAt,
        expires_at: workingConversation.expiresAt
      },
      context: {
        chars_used: workingConversation.charsUsed,
        warn_chars: config.contextWarnChars,
        target_chars: config.contextTargetChars,
        over_warn: workingConversation.charsUsed >= config.contextWarnChars,
        over_target: workingConversation.charsUsed >= config.contextTargetChars
      }
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

chatRouter.delete('/:conversation_id', (req: Request, res: Response) => {
  const conversationIdValue = req.params.conversation_id
  const conversationId = Array.isArray(conversationIdValue)
    ? conversationIdValue[0]
    : conversationIdValue

  if (!conversationId || conversationId.trim().length === 0) {
    res.status(400).json({
      error: 'validation_error',
      message: 'conversation_id path parameter is required',
      request_id: req.requestId
    })
    return
  }

  const deleted = deleteConversation(conversationId)
  res.json({
    success: true,
    conversation_id: conversationId,
    deleted,
    request_id: req.requestId
  })
})

export { chatRouter }
