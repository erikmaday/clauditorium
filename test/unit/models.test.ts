import { describe, expect, it, vi } from 'vitest'

describe('listAvailableModels', () => {
  it('parses and returns discovered models', async () => {
    vi.resetModules()
    vi.doMock('child_process', () => ({
      spawnSync: vi.fn(() => ({
        status: 0,
        stdout: 'claude-haiku-4-5-20251001\nclaude-sonnet-4-5-20250929\n',
        stderr: ''
      }))
    }))

    const { listAvailableModels } = await import('../../src/services/models')
    const models = listAvailableModels('abcd1234')

    expect(models).toEqual(['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929'])
  })

  it('throws normalized cli error when discovery command fails', async () => {
    vi.resetModules()
    vi.doMock('child_process', () => ({
      spawnSync: vi.fn(() => ({
        status: 1,
        stdout: '',
        stderr: 'claude not found'
      }))
    }))

    const { listAvailableModels } = await import('../../src/services/models')

    expect(() => listAvailableModels('abcd1234')).toThrowError('claude not found')
  })
})
