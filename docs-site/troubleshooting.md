# Troubleshooting

## Claude not found

```bash
which claude
claude --version
```

If missing, install Claude CLI and ensure it is on `PATH`.

## Claude auth issues

- Local machine: run `claude login`
- Containers/CI: set `CLAUDE_CODE_OAUTH_TOKEN`

## `401 unauthorized`

If `CLAUDE_API_KEY` is set, include header:

```bash
x-api-key: <your-key>
```

## `429 rate_limited`

Back off using `retry_after_seconds` and `Retry-After`.

## `429 concurrency_limited`

Claude queue is full. Either retry with backoff or increase:
- `CLAUDE_API_MAX_CONCURRENT`
- `CLAUDE_API_MAX_QUEUE`

## `504 queue_timeout` or `504 timeout`

- Increase `CLAUDE_API_QUEUE_TIMEOUT_MS` for queue waits.
- Increase `CLAUDE_API_TIMEOUT` for long-running Claude work.
- Reduce prompt/context size when possible.

## `503 shutting_down`

Service is in drain mode during graceful shutdown. Retry on a healthy instance.
