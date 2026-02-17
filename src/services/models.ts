import { spawnSync } from 'child_process'
import { config } from '../config/env'
import { createCliError } from '../core/errors'
import { log } from '../core/logger'

const MODEL_DISCOVERY_COMMAND =
  "strings \"$(which claude)\" | grep -E '^claude-(opus|sonnet|haiku)-[0-9]' | grep -v '\\[' | sort -u"

export function listAvailableModels(requestId: string): string[] {
  log('INFO', `[${requestId}] Discovering available Claude models`)

  const result = spawnSync('/bin/sh', ['-lc', MODEL_DISCOVERY_COMMAND], {
    encoding: 'utf8',
    timeout: config.startupCheckTimeoutMs
  })

  if (result.error) {
    throw createCliError(
      500,
      'models_unavailable',
      `Failed to discover models: ${result.error.message}`,
      requestId
    )
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() || `Model discovery command exited with code ${result.status}`
    throw createCliError(500, 'models_unavailable', stderr, requestId)
  }

  const models = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  log('INFO', `[${requestId}] Discovered ${models.length} Claude models`)
  return models
}
