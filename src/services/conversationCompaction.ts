import { Message } from '../types/api'
import { estimateConversationTokens } from './tokenBudget'

const SUMMARY_MARKER = '[AUTO_SUMMARY]'

export interface CompactionOptions {
  model?: string
  targetTokens: number
  keepRecentMessages: number
  summaryMaxChars: number
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value
  }

  if (maxChars <= 3) {
    return value.slice(0, maxChars)
  }

  return `${value.slice(0, maxChars - 3)}...`
}

function summarizeMessages(messages: Message[], maxChars: number): string {
  const normalizedLines = messages.map((message) => {
    const role = message.role.charAt(0).toUpperCase() + message.role.slice(1)
    const content = normalizeWhitespace(message.content)
    return `${role}: ${content}`
  })

  return truncate(normalizedLines.join('\n'), maxChars)
}

function stripAutoSummary(system?: string): string | undefined {
  if (!system) {
    return undefined
  }

  const markerIndex = system.indexOf(`\n\n${SUMMARY_MARKER}\n`)
  if (markerIndex === -1) {
    return system
  }

  return system.slice(0, markerIndex).trim() || undefined
}

function composeSystem(baseSystem: string | undefined, summary: string): string {
  const compactedBlock = `${SUMMARY_MARKER}\n${summary}`
  return baseSystem ? `${baseSystem}\n\n${compactedBlock}` : compactedBlock
}

export function compactConversationForBudget(
  messages: Message[],
  system: string | undefined,
  options: CompactionOptions
): {
  compacted: boolean
  compactedMessages: number
  messages: Message[]
  system?: string
  tokensUsed: number
} {
  const baseSystem = stripAutoSummary(system)
  const keepFloor = Math.max(2, options.keepRecentMessages)

  if (messages.length <= keepFloor) {
    return {
      compacted: false,
      compactedMessages: 0,
      messages: [...messages],
      system,
      tokensUsed: estimateConversationTokens(messages, system, options.model)
    }
  }

  const workingOlder: Message[] = []
  const workingRecent = [...messages]

  while (workingRecent.length > keepFloor) {
    const moved = workingRecent.shift()
    if (!moved) {
      break
    }

    workingOlder.push(moved)
  }

  if (workingOlder.length === 0) {
    return {
      compacted: false,
      compactedMessages: 0,
      messages: [...messages],
      system,
      tokensUsed: estimateConversationTokens(messages, system, options.model)
    }
  }

  let summary = summarizeMessages(workingOlder, options.summaryMaxChars)
  let compactedSystem = composeSystem(baseSystem, summary)
  let tokensUsed = estimateConversationTokens(workingRecent, compactedSystem, options.model)

  while (tokensUsed > options.targetTokens && workingRecent.length > 2) {
    const moved = workingRecent.shift()
    if (!moved) {
      break
    }

    workingOlder.push(moved)
    summary = summarizeMessages(workingOlder, options.summaryMaxChars)
    compactedSystem = composeSystem(baseSystem, summary)
    tokensUsed = estimateConversationTokens(workingRecent, compactedSystem, options.model)
  }

  return {
    compacted: true,
    compactedMessages: workingOlder.length,
    messages: workingRecent,
    system: compactedSystem,
    tokensUsed
  }
}
