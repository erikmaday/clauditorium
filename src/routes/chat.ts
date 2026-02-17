import { Router, Request, Response } from 'express'
import { runClaude } from '../clients/claudeCli'
import { normalizeCliError, ValidationError } from '../core/errors'
import { config } from '../config/env'
import { rejectDuringDrainMiddleware } from '../middleware/drainMode'
import { formatChatPrompt } from '../services/chatPrompt'
import { compactConversationForBudget } from '../services/conversationCompaction'
import {
  ConversationState,
  createConversation,
  deleteConversation,
  getConversation,
  saveConversation
} from '../services/conversationStore'
import {
  ApiErrorResponse,
  ChatConversationMetadataResponse,
  ChatResponse,
  DeleteConversationResponse,
  Message
} from '../types/api'
import { parseChatRequest } from './schemas'

const chatRouter = Router()

function normalizeConversationId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

chatRouter.post('/', rejectDuringDrainMiddleware, async (req: Request, res: Response<ChatResponse | ApiErrorResponse>) => {
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
      }, body.model)
    }

    const compactionResult = compactConversationForBudget(
      workingConversation.messages,
      workingConversation.system,
      {
        model: body.model,
        targetTokens: config.contextTargetTokens,
        keepRecentMessages: config.contextCompactKeepMessages,
        summaryMaxChars: config.contextSummaryMaxChars
      }
    )
    if (compactionResult.compacted) {
      workingConversation.messages = compactionResult.messages
      workingConversation.system = compactionResult.system
    }

    const prompt = formatChatPrompt(workingConversation.messages, workingConversation.system)
    const response = await runClaude(prompt, req.requestId!, body.model)
    workingConversation.messages.push({ role: 'assistant', content: response })
    saveConversation(workingConversation, body.model)

    const assistantMessage: Message = { role: 'assistant', content: response }
    const payload: ChatResponse = {
      success: true,
      conversation_id: workingConversation.id,
      message: assistantMessage,
      conversation: {
        id: workingConversation.id,
        created_at: workingConversation.createdAt,
        updated_at: workingConversation.updatedAt,
        expires_at: workingConversation.expiresAt
      },
      context: {
        // NOTE: tokens_used is an estimate derived from local conversation text.
        // TODO: Switch to authoritative token usage once available from Claude CLI.
        tokens_used: workingConversation.tokensUsed,
        warn_tokens: config.contextWarnTokens,
        target_tokens: config.contextTargetTokens,
        over_warn: workingConversation.tokensUsed >= config.contextWarnTokens,
        over_target: workingConversation.tokensUsed >= config.contextTargetTokens,
        compacted: compactionResult.compacted,
        compacted_messages: compactionResult.compactedMessages
      }
    }
    res.json(payload)
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

chatRouter.get('/:conversation_id', (req: Request, res: Response<ChatConversationMetadataResponse | ApiErrorResponse>) => {
  const conversationId = normalizeConversationId(req.params.conversation_id)

  if (!conversationId || conversationId.trim().length === 0) {
    res.status(400).json({
      error: 'validation_error',
      message: 'conversation_id path parameter is required',
      request_id: req.requestId
    })
    return
  }

  const conversation = getConversation(conversationId)
  if (!conversation) {
    res.status(404).json({
      error: 'not_found',
      message: 'conversation_id was not found',
      request_id: req.requestId
    })
    return
  }

  const payload: ChatConversationMetadataResponse = {
    success: true,
    conversation_id: conversation.id,
    status: 'active',
    message_count: conversation.messages.length,
    tokens_used: conversation.tokensUsed,
    last_activity_at: conversation.updatedAt,
    created_at: conversation.createdAt,
    expires_at: conversation.expiresAt,
    request_id: req.requestId || 'unknown'
  }
  res.json(payload)
})

chatRouter.delete('/:conversation_id', (req: Request, res: Response<DeleteConversationResponse | ApiErrorResponse>) => {
  const conversationId = normalizeConversationId(req.params.conversation_id)

  if (!conversationId || conversationId.trim().length === 0) {
    res.status(400).json({
      error: 'validation_error',
      message: 'conversation_id path parameter is required',
      request_id: req.requestId
    })
    return
  }

  const deleted = deleteConversation(conversationId)
  const payload: DeleteConversationResponse = {
    success: true,
    conversation_id: conversationId,
    deleted,
    request_id: req.requestId || 'unknown'
  }
  res.json(payload)
})

export { chatRouter }
