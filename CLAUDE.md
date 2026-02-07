# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a FastAPI REST API server that wraps the Claude CLI (OAuth-authenticated) to expose Claude's capabilities via HTTP endpoints. Uses async subprocess calls and uvicorn for high concurrency.

## Running the Server

```bash
make install  # Install dependencies
make run      # Start server
make dev      # Start with auto-reload
```

Server runs on `http://localhost:5051` by default.

## Prerequisites

The Claude CLI must be installed and authenticated (OAuth) on the host machine. The server invokes `claude -p <prompt>` via subprocess.

## API Endpoints

- `POST /ask` - Simple prompt/response (body: `{"prompt": "..."}`)
- `POST /chat` - Chat with message history (body: `{"messages": [...], "system": "..."}`)
- `GET /health` - Health check
- `GET /version` - API version and config info
- `GET /docs` - Interactive API documentation

## Configuration

Environment variables (all optional):
- `CLAUDE_API_HOST` - Server host (default: `127.0.0.1`)
- `CLAUDE_API_PORT` - Server port (default: `5051`)
- `CLAUDE_API_TIMEOUT` - Request timeout in seconds (default: `120`)
- `CLAUDE_API_CORS` - Enable CORS (default: `false`)
- `CLAUDE_API_LOG_LEVEL` - Logging level (default: `INFO`)
