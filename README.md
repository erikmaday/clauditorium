# Claude API Server

A REST API wrapper for the Claude CLI.

---

## TL;DR - Get Running in 30 Seconds

**Prerequisites:** Node.js 18+ and [Claude CLI](https://github.com/anthropics/claude-cli) authenticated (`claude login`)

```bash
npx clauditorium
```

**Or install globally:**
```bash
npm install -g clauditorium
clauditorium
```

**Test it:**
```bash
curl -X POST http://localhost:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'
```

That's it. Server runs on `http://localhost:5051`.

---

## Features

- Simple REST API for Claude
- Per-request model selection via `model` parameter
- Multi-turn chat with server-managed `conversation_id` context
- Configurable via environment variables
- Request tracking with unique IDs
- Environment and request validation with consistent error responses
- Minimal dependencies (Express + cors)

## Architecture

The server is organized into focused modules:

- `src/config` - Environment parsing and runtime version loading
- `src/core` - Logging and error helpers
- `src/clients` - Claude CLI process wrapper
- `src/services` - Prompt formatting helpers
- `src/routes` - Endpoint handlers and request validation
- `src/middleware` - Request ID, error handling, not-found handling
- `src/app.ts` - Express app composition
- `src/server.ts` - Startup and banner
- `src/index.ts` - CLI entrypoint

## Installation

```bash
# Run directly with npx (no install needed)
npx clauditorium

# Or install globally
npm install -g clauditorium

# Or install locally in a project
npm install clauditorium
```

## Development

```bash
npm run lint
npm run test
npm run test:coverage
npm run build
```

Coverage thresholds are enforced in CI via `npm run test:coverage`.

## Use In Another Dockerized App

Install `clauditorium` in your own Node service image and run it with a Claude token:

```dockerfile
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates binutils \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g @anthropic-ai/claude-code

COPY package*.json ./
RUN npm ci --omit=dev

CMD ["npx", "clauditorium"]
```

Runtime example:

```bash
docker run --rm -p 5051:5051 \
  -e CLAUDE_CODE_OAUTH_TOKEN="<token>" \
  your-image-name
```

## API Contract Governance

OpenAPI contract correctness is CI-gated with strict enforcement:

- `npm run openapi:lint` validates spec quality and structure
- `npm run openapi:validate` performs full OpenAPI schema validation
- `npm run contract:test` verifies runtime routes and response payloads against `openapi.yaml`

Run all contract checks locally:

```bash
npm run api:contract:check
```

Any endpoint, request/response shape, status code, or auth requirement change must include matching updates to `openapi.yaml` and contract tests in the same PR.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ask` | POST | Send a prompt, get a response |
| `/chat` | POST | Chat with persistent `conversation_id` context |
| `/models` | GET | List available Claude models discovered from local CLI binary |
| `/health` | GET | Health check |
| `/health/history` | GET | Recent Claude CLI readiness check history |
| `/health/recheck` | POST | Re-run Claude CLI readiness check |
| `/version` | GET | Version info |
| `/openapi.yaml` | GET | Raw OpenAPI specification |
| `/docs` | GET | Interactive API documentation UI |

`/version` reports the package version from `package.json` at runtime.

OpenAPI spec: [`openapi.yaml`](openapi.yaml)
Interactive docs: `http://localhost:5051/docs`

### POST /ask

```bash
curl -X POST http://localhost:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the capital of France?"}'
```

With a specific model:

```bash
curl -X POST http://localhost:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the capital of France?", "model": "claude-haiku-4-5-20251001"}'
```

### POST /chat

Start a new conversation (response returns `conversation_id`):

```bash
curl -X POST http://localhost:5051/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"},
      {"role": "assistant", "content": "Hi! How can I help?"},
      {"role": "user", "content": "What is 2+2?"}
    ],
    "system": "You are a helpful assistant.",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

Continue the same chat without resending full history:

```bash
curl -X POST http://localhost:5051/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "YOUR_CONVERSATION_ID",
    "message": "Can you summarize that?"
  }'
```

If `conversation_id` is unknown/expired, `/chat` returns `400 validation_error`.

### GET /models

```bash
curl http://localhost:5051/models
```

Example response:

```json
{
  "count": 2,
  "models": [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250929"
  ]
}
```

The `model` parameter is optional for both endpoints. When omitted, the CLI default model is used.
`/chat` responses include `conversation_id`, which you can reuse for continuation calls.

If `CLAUDE_API_KEY` is set, requests to `/ask` and `/chat` must include:

```bash
-H "x-api-key: your-api-key"
```

`/health` now includes readiness details for Claude CLI. With `CLAUDE_API_STRICT_HEALTH=true`, `/health` returns `503` when Claude CLI is not ready.

`GET /health/history` returns an in-memory rolling window of recent readiness checks for diagnostics.
Use `GET /health/history?since=2026-01-01T00:00:00.000Z` to filter entries by timestamp.

`POST /health/recheck` triggers a new Claude CLI readiness check without restarting the server. This endpoint requires `x-api-key` and returns `503` if `CLAUDE_API_KEY` is not configured.

## Error Taxonomy

| Error Code | Typical HTTP Status | Retryable? | Client Action |
|------------|---------------------|------------|---------------|
| `validation_error` | `400` | No | Fix request body or env value |
| `unauthorized` | `401` | No | Provide correct `x-api-key` |
| `not_found` | `404` | No | Correct endpoint path/method |
| `payload_too_large` | `413` | No | Reduce request payload size |
| `rate_limited` | `429` | Yes (after delay) | Wait for window to reset; retry after `retry_after_seconds` |
| `timeout` | `504` | Yes | Retry with simpler prompt or higher timeout |
| `cli_error` | `500` | Sometimes | Check Claude CLI stderr/auth/session |
| `spawn_error` | `500` | Sometimes | Verify Claude CLI install and PATH |
| `models_unavailable` | `500` | Sometimes | Ensure Claude CLI is installed and locally discoverable |
| `unknown_error` | `500` | Yes | Retry; inspect logs if persistent |
| `internal_error` | `500` | Yes | Retry; inspect server logs |
| `api_key_not_configured` | `503` | No | Set `CLAUDE_API_KEY` on server |

Sample error response:

```json
{
  "error": "validation_error",
  "message": "prompt is required",
  "request_id": "a1b2c3d4"
}
```

## Configuration

Set these environment variables to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_API_HOST` | `127.0.0.1` | Server host |
| `CLAUDE_API_PORT` | `5051` | Server port |
| `CLAUDE_API_TIMEOUT` | `120` | Request timeout (seconds) |
| `CLAUDE_API_STARTUP_CHECK_TIMEOUT` | `5` | Startup timeout for Claude CLI readiness check (seconds) |
| `CLAUDE_API_RATE_LIMIT_WINDOW_SECONDS` | `60` | Per-IP rate-limit window for `/ask` and `/chat` (seconds) |
| `CLAUDE_API_RATE_LIMIT_MAX_REQUESTS` | `0` | Max requests per IP per window (`0` disables rate limiting) |
| `CLAUDE_API_HEALTH_HISTORY_LIMIT` | `25` | Max readiness entries retained in memory |
| `CLAUDE_API_BODY_LIMIT` | `1mb` | Max JSON request body size |
| `CLAUDE_API_CORS` | `false` | Enable CORS |
| `CLAUDE_API_LOG_LEVEL` | `INFO` | Log level |
| `CLAUDE_API_STRICT_HEALTH` | `false` | Return `503` from `/health` when Claude CLI is not ready |
| `CLAUDE_API_KEY` | _(unset)_ | Optional API key for `/ask` and `/chat` |

Example:
```bash
CLAUDE_API_PORT=8080 clauditorium
```

## Troubleshooting

**"Claude CLI not found"**
```bash
# Verify Claude CLI is installed
which claude
claude --version
```

**"Authentication required"**
```bash
claude login
```

**Request timeouts**
```bash
CLAUDE_API_TIMEOUT=300 clauditorium
```

**CORS errors in browser**
```bash
CLAUDE_API_CORS=true clauditorium
```

## License

MIT - see [LICENSE](LICENSE)
