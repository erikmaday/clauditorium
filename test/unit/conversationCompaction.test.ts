import { describe, expect, it } from 'vitest'
import { compactConversationForBudget } from '../../src/services/conversationCompaction'

describe('conversationCompaction', () => {
  it('compacts older messages while preserving recent turns', () => {
    const result = compactConversationForBudget(
      [
        { role: 'user', content: 'first question '.repeat(80) },
        { role: 'assistant', content: 'first answer '.repeat(80) },
        { role: 'user', content: 'second question '.repeat(80) },
        { role: 'assistant', content: 'second answer '.repeat(80) },
        { role: 'user', content: 'latest question '.repeat(80) }
      ],
      'You are helpful',
      {
        targetTokens: 120,
        keepRecentMessages: 3,
        summaryMaxChars: 800
      }
    )

    expect(result.compacted).toBe(true)
    expect(result.compactedMessages).toBeGreaterThan(0)
    expect(result.messages.at(-1)?.content).toContain('latest question')
    expect(result.system).toContain('[AUTO_SUMMARY]')
  })
})
