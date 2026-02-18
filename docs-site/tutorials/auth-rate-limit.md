# Tutorial: Auth and Rate Limits

## Protect API with a key

Start server with:

```bash
CLAUDE_API_KEY=secret-key npx clauditorium
```

Requests to `/ask` and `/chat` must include:

```bash
-H "x-api-key: secret-key"
```

Missing/invalid key returns `401 unauthorized`.

## Trigger and handle rate limiting

Example config:

```bash
CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS=60 \
CLAUDE_API_RATE_LIMIT_MAX_REQUESTS=1 \
npx clauditorium
```

Second request in the window returns `429 rate_limited` with:
- `Retry-After` header
- `retry_after_seconds` body field

## Client retry pattern

1. If `429`, wait `retry_after_seconds`.
2. Retry once or with bounded backoff.
3. Log `request_id` for debugging.

## Related transient errors

- `concurrency_limited` (`429`): queue full
- `queue_timeout` (`504`): waited too long in queue
- `timeout` (`504`): Claude execution timeout

Treat these as retryable with limits.
