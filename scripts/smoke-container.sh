#!/usr/bin/env sh
set -eu

IMAGE="${1:-clauditorium-consumer:local}"
CONTAINER_NAME="clauditorium-smoke-$(date +%s)"
PORT="${CLAUDITORIUM_SMOKE_PORT:-5051}"

cleanup() {
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  docker run -d --rm --name "${CONTAINER_NAME}" -p "${PORT}:5051" \
    -e CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN}" \
    "${IMAGE}" >/dev/null
else
  docker run -d --rm --name "${CONTAINER_NAME}" -p "${PORT}:5051" "${IMAGE}" >/dev/null
fi

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

health="$(curl -fsS "http://127.0.0.1:${PORT}/health")"
echo "${health}" | grep -q '"status":"ok"'

models="$(curl -fsS "http://127.0.0.1:${PORT}/models")"
echo "${models}" | grep -q '"models"'
echo "${models}" | grep -Eq 'claude-(haiku|sonnet|opus)-[0-9]'

ask="$(curl -fsS -X POST "http://127.0.0.1:${PORT}/ask" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Reply with only mocked"}')"
echo "${ask}" | grep -q '"success":true'

echo "Container smoke test passed for ${IMAGE}"
