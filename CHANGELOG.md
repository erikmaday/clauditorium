# Changelog

All notable changes to this project are documented in this file.

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
