# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Overview

Clauditorium is an Express REST API server that wraps the Claude CLI (OAuth-authenticated) to expose Claude's capabilities via HTTP endpoints.

## Running the Server

```bash
npm install   # Install dependencies
npm start     # Start server
npm run dev   # Start with auto-reload
```

Server runs on `http://localhost:5051` by default.

## Prerequisites

The Claude CLI must be installed and authenticated (OAuth) on the host machine. The server invokes `claude -p <prompt>` via subprocess.

## API Endpoints

- `POST /ask` - Simple prompt/response (body: `{"prompt": "..."}`)
- `POST /chat` - Chat with message history (body: `{"messages": [...], "system": "..."}`)
- `GET /health` - Health check
- `GET /version` - API version and config info

## Configuration

Environment variables (all optional):
- `CLAUDE_API_HOST` - Server host (default: `127.0.0.1`)
- `CLAUDE_API_PORT` - Server port (default: `5051`)
- `CLAUDE_API_TIMEOUT` - Request timeout in seconds (default: `120`)
- `CLAUDE_API_CORS` - Enable CORS (default: `false`)
- `CLAUDE_API_LOG_LEVEL` - Logging level (default: `INFO`)
