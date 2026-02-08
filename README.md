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
- Multi-turn chat with message history
- Configurable via environment variables
- Request tracking with unique IDs
- Minimal dependencies (Express + cors)

## Installation

```bash
# Run directly with npx (no install needed)
npx clauditorium

# Or install globally
npm install -g clauditorium

# Or install locally in a project
npm install clauditorium
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ask` | POST | Send a prompt, get a response |
| `/chat` | POST | Chat with message history |
| `/health` | GET | Health check |
| `/version` | GET | Version info |

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

The `model` parameter is optional for both endpoints. When omitted, the CLI default model is used.

## Configuration

Set these environment variables to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_API_HOST` | `127.0.0.1` | Server host |
| `CLAUDE_API_PORT` | `5051` | Server port |
| `CLAUDE_API_TIMEOUT` | `120` | Request timeout (seconds) |
| `CLAUDE_API_CORS` | `false` | Enable CORS |
| `CLAUDE_API_LOG_LEVEL` | `INFO` | Log level |

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
