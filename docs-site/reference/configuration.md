# Configuration Reference

## Core network and timeout

- `CLAUDE_API_HOST` (default: `127.0.0.1`)
- `CLAUDE_API_PORT` (default: `5051`)
- `CLAUDE_API_TIMEOUT` (default: `120` seconds)
- `CLAUDE_API_BODY_LIMIT` (default: `1mb`)

## Claude runtime queue controls

- `CLAUDE_API_MAX_CONCURRENT` (default: `4`)
- `CLAUDE_API_MAX_QUEUE` (default: `100`)
- `CLAUDE_API_QUEUE_TIMEOUT_MS` (default: `15000`)
- `CLAUDE_API_DRAIN_TIMEOUT_SECONDS` (default: `30`)

## Auth and request protection

- `CLAUDE_API_KEY` (optional)
- `CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS` (default: `60`)
- `CLAUDE_API_RATE_LIMIT_MAX_REQUESTS` (default: `0`, disabled)

## Health and readiness

- `CLAUDE_API_STARTUP_CHECK_TIMEOUT` (default: `5`)
- `CLAUDE_API_STRICT_HEALTH` (default: `false`)
- `CLAUDE_API_HEALTH_HISTORY_LIMIT` (default: `25`)

## Conversation lifecycle and context

- `CLAUDE_API_CONVERSATION_TTL_SECONDS` (default: `86400`)
- `CLAUDE_API_MAX_CONVERSATIONS` (default: `1000`)
- `CLAUDE_API_CONTEXT_WARN_TOKENS` (default: `12000`)
- `CLAUDE_API_CONTEXT_TARGET_TOKENS` (default: `18000`)
- `CLAUDE_API_CONTEXT_COMPACT_KEEP_MESSAGES` (default: `6`)
- `CLAUDE_API_CONTEXT_SUMMARY_MAX_CHARS` (default: `2000`)

## Claude process isolation

- `CLAUDE_API_ISOLATE_CWD` (default: `true`)
- `CLAUDE_API_CLAUDE_CWD` (default: system temp dir)

## CORS and logging

- `CLAUDE_API_CORS` (default: `false`)
- `CLAUDE_API_LOG_LEVEL` (`DEBUG|INFO|WARN|ERROR`, default: `INFO`)

See `.env.example` for a runnable template.
