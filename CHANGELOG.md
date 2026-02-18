# Changelog

All notable changes to this project are documented in this file.

## [1.4.1] - 2026-02-18

### Added
- VitePress documentation site with quickstart, tutorials, reference pages, troubleshooting, and OpenAPI explorer.
- Docs build/deploy workflow for GitHub Pages (`.github/workflows/docs-pages.yml`).
- Docs OpenAPI sync script (`scripts/sync-docs-openapi.ts`) and related npm scripts (`docs:*`).
- Tag-driven GitHub release automation (`.github/workflows/release-on-tag.yml`).

### Changed
- Updated README with the new docs site link and docs development/build/check workflow.
- Updated npm package metadata `homepage` to point to published docs.

### Fixed
- Restored a removed import regression affecting recent docs-related changes.

## [1.4.0] - 2026-02-17

### Breaking Changes
- `POST /chat` request contract changed:
  - `messages` input is no longer accepted.
  - `message` is now required for both new and continuing conversations.
  - `system` is only valid when creating a new conversation (without `conversation_id`).

### Added
- Conversation lifecycle APIs:
  - `GET /chat/{conversation_id}` for metadata (status, message count, token estimate, timestamps).
  - `DELETE /chat/{conversation_id}` for explicit conversation cleanup.
- Conversation memory guardrails:
  - configurable TTL and max in-memory conversations.
- Token-aware context budgeting metadata and automatic context compaction for long-running chats.
- Runtime concurrency controls for Claude CLI execution:
  - max concurrent workers, bounded queue, queue timeout, and queue-related error codes.
- Structured JSON logging and Prometheus metrics via `GET /metrics`.
- Graceful shutdown drain mode:
  - rejects new `POST /ask`/`POST /chat` during drain (`503 shutting_down`),
  - waits for in-flight/queued Claude jobs to finish before exit.
- OpenAPI-first contract governance enhancements:
  - generated TS type sync check (`openapi:types:check`) wired into `api:contract:check`.
- Container-consumer smoke test script (`scripts/smoke-container.sh`) and CI coverage for Docker consumer flows.

### Changed
- OpenAPI contract expanded to include:
  - chat lifecycle endpoints,
  - richer `ChatResponse` metadata (`conversation`, `context`),
  - graceful shutdown `503` responses for `/ask` and `/chat`.
- Runtime stack/tooling upgrades:
  - Express 5 runtime alignment,
  - Vitest 4 and ESLint 10 upgrades.
- README expanded with compatibility notes, container-consumer guidance, metrics/observability coverage, and updated chat usage examples.

## [1.3.0] - 2026-02-17

### Documentation
- Clarified how to use `clauditorium` as an npm dependency inside external Dockerized Node applications.
- Added a concise token-based runtime example using `CLAUDE_CODE_OAUTH_TOKEN`.

## [1.2.1] - 2026-02-17

### Fixed
- OpenAPI 3.0 schema compliance for `/chat` request examples by moving examples to a valid requestBody media-type location.
- Restored `npm run openapi:validate` success in CI/local checks.

## [1.2.0] - 2026-02-17

### Added
- Runtime hardening: optional API key protection, JSON payload size limits, request-duration logging, and per-IP rate limiting for `/ask` and `/chat`.
- Claude CLI readiness checks at startup with strict health mode support.
- Health operations:
  - `POST /health/recheck` to re-run readiness checks without restart.
  - `GET /health/history` with optional `?since=` filtering.
  - Health observability metadata including uptime and readiness check duration/result fields.
- Interactive API docs and spec endpoints: `GET /docs` and `GET /openapi.yaml`.
- Persistent chat context flow via `conversation_id` on `/chat` so clients can continue conversations across calls.
- `GET /models` endpoint to list available local Claude models discovered from the Claude binary.

### Changed
- Refactored server structure into clearer modules (`config`, `core`, `clients`, `services`, `routes`, `middleware`) with stronger request/error handling.
- Improved environment validation and runtime configurability for hardening/readiness/rate-limit/history settings.
- Expanded test coverage across unit, integration, and contract layers.

### Documentation
- Added structured error taxonomy with retry guidance and sample responses.
- Expanded README endpoint docs for readiness, recheck/history, chat continuation via `conversation_id`, and model discovery.

### Quality and CI
- Enforced OpenAPI governance in CI:
  - spec linting and validation
  - route coverage checks
  - response contract tests against `openapi.yaml`
- Added coverage thresholds to reduce regression creep.

## [1.1.1] - 2026-02-16

### Added
- Hardened Claude process spawning by stripping inherited ClaudeCode-related environment variables before invoking the CLI.

### Changed
- Patch release containing stability-focused updates.

## [1.1.0] - 2026-02-08

### Added
- Optional per-request model selection for Claude API calls.

### Changed
- Rewrote the project as a Node.js/TypeScript package for npm distribution.
- Simplified and clarified README onboarding flow.

## [1.0.0] - 2026-02-06

### Added
- Initial release of the Claude API Server.
