# Clauditorium Docs

Run Claude Code as a clean REST API service with conversation support, health/readiness endpoints, and production guardrails.

## Start Here

- New to Clauditorium: [Quickstart](/quickstart)
- Want multi-turn context: [First Chat Flow](/tutorials/first-chat)
- Need auth/retries: [Auth and Rate Limits](/tutorials/auth-rate-limit)
- Want endpoint details: [API Reference](/reference/endpoints)
- Need interactive contract docs: [OpenAPI Explorer](/reference/openapi-explorer)

## What You Get

- `POST /ask` for single prompt/response
- `POST /chat` + `conversation_id` for multi-turn context
- `GET/DELETE /chat/{conversation_id}` lifecycle controls
- Operational endpoints: `/health`, `/health/history`, `/metrics`, `/version`
- Production controls: API key, rate limits, queue limits, graceful drain mode

## 60-Second Check

```bash
npx clauditorium

curl -s http://127.0.0.1:5051/health
curl -s -X POST http://127.0.0.1:5051/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Reply with only: ready"}'
```

If the second call returns `{ "success": true, ... }`, your service path is working.

::: tip
Use this docs site for tutorials. Use the [OpenAPI Explorer](/reference/openapi-explorer) for exact schemas.
:::
