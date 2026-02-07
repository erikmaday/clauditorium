# Claude API Server

A REST API wrapper for the Claude CLI.

---

## TL;DR - Get Running in 30 Seconds

**Prerequisites:** Python 3.9+ and [Claude CLI](https://github.com/anthropics/claude-cli) authenticated (`claude login`)

```bash
pip install -r requirements.txt
python claude_api.py
```

**Test it:**
```bash
curl -X POST http://localhost:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'
```

That's it. Server runs on `http://localhost:5051`. API docs at `http://localhost:5051/docs`.

---

## Features

- Simple REST API for Claude
- Multi-turn chat with message history
- Configurable via environment variables
- Request tracking with unique IDs
- Interactive API docs at `/docs`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ask` | POST | Send a prompt, get a response |
| `/chat` | POST | Chat with message history |
| `/health` | GET | Health check |
| `/version` | GET | Version info |
| `/docs` | GET | Interactive API docs |

### POST /ask

```bash
curl -X POST http://localhost:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the capital of France?"}'
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
    "system": "You are a helpful assistant."
  }'
```

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
CLAUDE_API_PORT=8080 python claude_api.py
```

## Makefile Commands

```bash
make install  # Install dependencies
make run      # Start server
make dev      # Start with auto-reload
make test     # Run health check
make help     # Show all commands
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
CLAUDE_API_TIMEOUT=300 python claude_api.py
```

**CORS errors in browser**
```bash
CLAUDE_API_CORS=true python claude_api.py
```

## License

MIT - see [LICENSE](LICENSE)
