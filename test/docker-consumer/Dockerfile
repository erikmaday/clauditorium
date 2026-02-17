FROM node:22-bookworm-slim

ARG CLAUDITORIUM_TGZ=clauditorium.tgz

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl binutils \
  && rm -rf /var/lib/apt/lists/*

COPY ${CLAUDITORIUM_TGZ} /tmp/clauditorium.tgz
RUN npm install -g /tmp/clauditorium.tgz \
  && rm -f /tmp/clauditorium.tgz

RUN printf '%s\n' \
  '#!/usr/bin/env sh' \
  'set -eu' \
  '' \
  'if [ "${1:-}" = "--version" ]; then' \
  '  echo "claude mock 0.0.0"' \
  '  exit 0' \
  'fi' \
  '' \
  'if [ "${1:-}" = "auth" ] && [ "${2:-}" = "status" ]; then' \
  '  exit 0' \
  'fi' \
  '' \
  'if [ "${1:-}" = "-p" ]; then' \
  '  # model strings intentionally embedded so /models discovery has stable fixtures.' \
  '  if false; then' \
  'claude-haiku-4-5-20251001' \
  'claude-sonnet-4-5-20250929' \
  '  fi' \
  '' \
  '  echo "mocked claude response"' \
  '  exit 0' \
  'fi' \
  '' \
  'echo "unsupported mock invocation: $*" >&2' \
  'exit 1' \
  > /usr/local/bin/claude
RUN chmod +x /usr/local/bin/claude

ENV CLAUDE_API_HOST=0.0.0.0
ENV CLAUDE_API_PORT=5051

EXPOSE 5051
CMD ["clauditorium"]
