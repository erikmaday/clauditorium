# Observability

## Health payloads

`GET /health` returns:
- overall `status`
- `strict_mode`
- current readiness (`readiness.claude_cli`)
- process/runtime observability (`observability`)

`observability.claude_runtime` includes:
- `active_requests`
- `queued_requests`
- `max_concurrent`
- `max_queue`
- `rejected_total`
- `queue_timeouts_total`

## Readiness history

`GET /health/history` returns rolling readiness checks.
Use `?since=<ISO-8601>` to filter newer entries.

## Metrics endpoint

`GET /metrics` exposes Prometheus-formatted metrics suitable for scraping.

## Logs

Logs are JSON structured (`pino`) and include key fields such as:
- `event`
- `request_id`
- `method`, `path`, `status_code`
- `duration_ms`

Use `request_id` to correlate client errors with server logs.
