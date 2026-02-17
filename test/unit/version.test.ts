import { describe, expect, it, vi } from 'vitest'

describe('config/version', () => {
  it('loads package version from package.json', async () => {
    vi.resetModules()
    const { VERSION } = await import('../../src/config/version')

    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
