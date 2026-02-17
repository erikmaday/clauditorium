import { describe, expect, it } from 'vitest'
import { estimateConversationTokens, estimateTextTokens } from '../../src/services/tokenBudget'

describe('tokenBudget', () => {
  it('estimates text tokens with model-aware heuristics', () => {
    const text = 'a'.repeat(360)
    const haikuTokens = estimateTextTokens(text, 'claude-haiku-4-5-20251001')
    const opusTokens = estimateTextTokens(text, 'claude-opus-4-20260101')

    expect(haikuTokens).toBeGreaterThan(opusTokens)
  })

  it('estimates conversation tokens including message overhead', () => {
    const tokens = estimateConversationTokens(
      [
        { role: 'user', content: 'hello there' },
        { role: 'assistant', content: 'hi' }
      ],
      'be concise',
      'claude-sonnet-4-5-20250929'
    )

    expect(tokens).toBeGreaterThan(0)
  })
})
