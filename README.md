# Claude API Server

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)

A lightweight REST API server that wraps the Claude CLI, exposing Claude's capabilities via HTTP endpoints. Built with FastAPI for high performance and async support.

## Features

- **Simple REST API** - Clean HTTP endpoints for interacting with Claude
- **Async Architecture** - Built on FastAPI with full async/await support for high concurrency
- **Chat History Support** - Multi-turn conversations with message history
- **System Prompts** - Optional system prompt configuration for chat sessions
- **Request Tracking** - Unique request IDs for debugging and monitoring
- **Configurable** - Environment variable configuration for host, port, timeout, and CORS
- **Interactive Docs** - Auto-generated OpenAPI documentation at `/docs`

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/claude-api.git
cd claude-api

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
python claude_api.py
```

The server will be available at `http://127.0.0.1:5051`

## Prerequisites

- **Python 3.9+**
- **Claude CLI** - Must be installed and authenticated via OAuth
  ```bash
  # Install Claude CLI (if not already installed)
  npm install -g @anthropic/claude-cli

  # Authenticate (follow the prompts)
  claude login
  ```

## Installation

### Using pip

```bash
pip install -r requirements.txt
```

### Using Make

```bash
make install
```

## Usage

### Starting the Server

```bash
# Default (localhost:5051)
python claude_api.py

# Or with Make
make run

# With auto-reload for development
make dev
```

### API Endpoints

#### POST /ask - Simple Prompt/Response

Send a single prompt and get a response.

```bash
curl -X POST http://localhost:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the capital of France?"}'
```

**Response:**
```json
{
  "success": true,
  "response": "The capital of France is Paris."
}
```

#### POST /chat - Chat with Message History

Send a conversation with message history and optional system prompt.

```bash
curl -X POST http://localhost:5051/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"},
      {"role": "assistant", "content": "Hi there! How can I help you?"},
      {"role": "user", "content": "What is 2+2?"}
    ],
    "system": "You are a helpful math tutor."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "2 + 2 equals 4."
  }
}
```

#### GET /health - Health Check

Check if the server is running.

```bash
curl http://localhost:5051/health
```

**Response:**
```json
{
  "status": "ok"
}
```

#### GET /version - Version Info

Get API version and configuration details.

```bash
curl http://localhost:5051/version
```

**Response:**
```json
{
  "version": "1.0.0",
  "timeout": 120,
  "cors_enabled": false
}
```

#### GET /docs - Interactive Documentation

Visit `http://localhost:5051/docs` in your browser for interactive API documentation powered by Swagger UI.

## Configuration

Configure the server using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_API_HOST` | Server host address | `127.0.0.1` |
| `CLAUDE_API_PORT` | Server port | `5051` |
| `CLAUDE_API_TIMEOUT` | Request timeout in seconds | `120` |
| `CLAUDE_API_CORS` | Enable CORS (`true`/`false`) | `false` |
| `CLAUDE_API_LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` |

### Example with Environment Variables

```bash
CLAUDE_API_PORT=8080 CLAUDE_API_CORS=true python claude_api.py
```

Or create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
# Edit .env with your settings
```

## Error Handling

The API returns structured error responses:

```json
{
  "detail": {
    "error": "timeout",
    "message": "Request timed out after 120 seconds",
    "request_id": "a1b2c3d4"
  }
}
```

**Error Types:**
- `timeout` (504) - Request exceeded the configured timeout
- `cli_error` (500) - Claude CLI returned an error

## Troubleshooting

### "Claude CLI not found"

Ensure the Claude CLI is installed and in your PATH:
```bash
which claude  # Should show the path to claude
claude --version  # Should show the version
```

### "Authentication required"

The Claude CLI needs to be authenticated:
```bash
claude login
```

### Request timeouts

Increase the timeout for long-running requests:
```bash
CLAUDE_API_TIMEOUT=300 python claude_api.py
```

### CORS errors in browser

Enable CORS for browser-based clients:
```bash
CLAUDE_API_CORS=true python claude_api.py
```

## Development

### Running with Auto-reload

```bash
make dev
```

### Running Tests

```bash
make test
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [Claude](https://anthropic.com/claude) from Anthropic
