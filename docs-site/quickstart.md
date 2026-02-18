# Quickstart

## Prerequisites

- Node.js 18+
- Claude CLI installed and authenticated

```bash
which claude
claude --version
```

For containerized usage, set `CLAUDE_CODE_OAUTH_TOKEN`.

## Run the Service

```bash
npx clauditorium
```

Default bind: `http://127.0.0.1:5051`

## Verify Core Endpoints

```bash
curl -s http://127.0.0.1:5051/health
curl -s http://127.0.0.1:5051/models
curl -s -X POST http://127.0.0.1:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2+2?"}'
```

Expected `ask` shape:

```json
{
  "success": true,
  "response": "..."
}
```

## Next Steps

1. Learn multi-turn context: [First Chat Flow](/tutorials/first-chat)
2. Add API key and retry logic: [Auth and Rate Limits](/tutorials/auth-rate-limit)
3. Review deployment guardrails: [Production Hardening](/tutorials/production-hardening)
