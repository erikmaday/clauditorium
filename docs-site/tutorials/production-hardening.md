# Tutorial: Production Hardening

This guide covers baseline settings for container or VM deployment.

## Recommended baseline

```bash
CLAUDE_API_KEY=change-me \
CLAUDE_API_TIMEOUT=120 \
CLAUDE_API_MAX_CONCURRENT=4 \
CLAUDE_API_MAX_QUEUE=100 \
CLAUDE_API_QUEUE_TIMEOUT_MS=15000 \
CLAUDE_API_DRAIN_TIMEOUT_SECONDS=30 \
CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS=60 \
CLAUDE_API_RATE_LIMIT_MAX_REQUESTS=30 \
CLAUDE_API_STRICT_HEALTH=true \
npx clauditorium
```

## Graceful shutdown behavior

On `SIGTERM`/`SIGINT`:

1. Service enters drain mode.
2. New `POST /ask` and `POST /chat` requests return `503 shutting_down`.
3. In-flight/queued Claude work is allowed to finish (up to drain timeout).
4. Process exits.

## Health and readiness checks

- Liveness/readiness endpoint: `GET /health`
- Historical readiness data: `GET /health/history`
- Manual readiness refresh: `POST /health/recheck` (requires API key)

## Observability

- Structured JSON logs for request outcomes and shutdown events
- Prometheus metrics: `GET /metrics`

## Conversation memory safety

Use TTL and max conversation settings to bound memory:
- `CLAUDE_API_CONVERSATION_TTL_SECONDS`
- `CLAUDE_API_MAX_CONVERSATIONS`
