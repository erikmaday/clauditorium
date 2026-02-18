# Endpoint Reference

## Prompt

- `POST /ask`: single prompt/response

## Chat

- `POST /chat`: create/continue conversation using `message` (+ optional `conversation_id`)
- `GET /chat/{conversation_id}`: conversation metadata
- `DELETE /chat/{conversation_id}`: remove in-memory conversation

## Health and Ops

- `GET /health`: health + readiness + runtime observability
- `GET /health/history`: rolling readiness history (`?since=` optional)
- `POST /health/recheck`: force readiness re-check (API key required)
- `GET /metrics`: Prometheus metrics
- `GET /version`: service version metadata

## Discovery and Docs

- `GET /models`: locally available Claude models
- `GET /openapi.yaml`: OpenAPI spec
- `GET /docs`: runtime Swagger docs UI

## Common Error Codes

- `validation_error` (`400`): request shape/value issue
- `unauthorized` (`401`): missing/invalid API key
- `payload_too_large` (`413`): body exceeds configured limit
- `rate_limited` (`429`): per-IP rate cap reached
- `concurrency_limited` (`429`): Claude queue is full
- `shutting_down` (`503`): drain mode enabled
- `queue_timeout` (`504`): queue wait exceeded timeout
- `timeout` (`504`): Claude execution timeout
- `cli_error` / `spawn_error` / `internal_error` (`500`): runtime/internal failures

For exact schemas and all statuses, use [OpenAPI Explorer](/reference/openapi-explorer).
