#!/usr/bin/env python3
"""
Claude API Server - Wraps Claude CLI (OAuth) as a REST API

A lightweight FastAPI server that exposes Claude's capabilities via HTTP endpoints.
Requires the Claude CLI to be installed and authenticated on the host machine.
"""

import asyncio
import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel

# Version
__version__ = "1.0.0"

# Configuration from environment variables
HOST = os.getenv("CLAUDE_API_HOST", "127.0.0.1")
PORT = int(os.getenv("CLAUDE_API_PORT", "5051"))
TIMEOUT = int(os.getenv("CLAUDE_API_TIMEOUT", "120"))
ENABLE_CORS = os.getenv("CLAUDE_API_CORS", "false").lower() == "true"
LOG_LEVEL = os.getenv("CLAUDE_API_LOG_LEVEL", "INFO").upper()

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("claude-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    logger.info(f"Claude API Server v{__version__} starting...")
    logger.info(f"Host: {HOST}, Port: {PORT}, Timeout: {TIMEOUT}s")
    logger.info(f"CORS: {'enabled' if ENABLE_CORS else 'disabled'}")
    logger.info(f"API Docs: http://{HOST}:{PORT}/docs")
    yield
    logger.info("Claude API Server shutting down...")


app = FastAPI(
    title="Claude API Server",
    description="REST API wrapper for the Claude CLI",
    version=__version__,
    default_response_class=ORJSONResponse,
    lifespan=lifespan
)

# Add CORS middleware if enabled
if ENABLE_CORS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request for tracking."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    logger.debug(f"[{request_id}] {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


class AskRequest(BaseModel):
    prompt: str

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "What is the capital of France?"
            }
        }


class Message(BaseModel):
    role: str = "user"
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    system: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "messages": [
                    {"role": "user", "content": "Hello!"},
                    {"role": "assistant", "content": "Hi there! How can I help you?"},
                    {"role": "user", "content": "What's 2+2?"}
                ],
                "system": "You are a helpful assistant."
            }
        }


class ErrorDetail(BaseModel):
    error: str
    message: str
    request_id: Optional[str] = None


async def run_claude(prompt: str, request: Request) -> str:
    """Execute Claude CLI with the given prompt."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info(f"[{request_id}] Running Claude CLI (prompt length: {len(prompt)} chars)")

    proc = await asyncio.create_subprocess_exec(
        'claude', '-p', prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=TIMEOUT)
    except asyncio.TimeoutError:
        proc.kill()
        logger.error(f"[{request_id}] Request timed out after {TIMEOUT}s")
        raise HTTPException(
            status_code=504,
            detail={
                "error": "timeout",
                "message": f"Request timed out after {TIMEOUT} seconds",
                "request_id": request_id
            }
        )

    if proc.returncode != 0:
        error_msg = stderr.decode().strip() or "Claude CLI returned non-zero exit code"
        logger.error(f"[{request_id}] Claude CLI error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "cli_error",
                "message": error_msg,
                "request_id": request_id
            }
        )

    response = stdout.decode().strip()
    logger.info(f"[{request_id}] Claude CLI response (length: {len(response)} chars)")
    return response


@app.post('/ask', summary="Simple prompt/response", tags=["Chat"])
async def ask(req: AskRequest, request: Request):
    """
    Send a single prompt to Claude and get a response.

    This is the simplest way to interact with Claude - just send a prompt
    and receive a response.
    """
    response = await run_claude(req.prompt, request)
    return {'success': True, 'response': response}


@app.post('/chat', summary="Chat with message history", tags=["Chat"])
async def chat(req: ChatRequest, request: Request):
    """
    Send a conversation with message history to Claude.

    Supports multi-turn conversations with optional system prompts.
    Messages should alternate between 'user' and 'assistant' roles.
    """
    prompt_parts = []
    if req.system:
        prompt_parts.append(f"System: {req.system}\n")

    for msg in req.messages:
        prompt_parts.append(f"{msg.role.capitalize()}: {msg.content}")

    response = await run_claude("\n".join(prompt_parts), request)
    return {'success': True, 'message': {'role': 'assistant', 'content': response}}


@app.get('/health', summary="Health check", tags=["System"])
async def health():
    """
    Check if the API server is running and healthy.

    Returns a simple status message. Use this endpoint for
    load balancer health checks or monitoring.
    """
    return {'status': 'ok'}


@app.get('/version', summary="Get API version", tags=["System"])
async def version():
    """
    Get the current API server version.

    Returns version information and configuration details.
    """
    return {
        'version': __version__,
        'timeout': TIMEOUT,
        'cors_enabled': ENABLE_CORS
    }


if __name__ == '__main__':
    import uvicorn

    print(f"\n{'='*50}")
    print(f"  Claude API Server v{__version__}")
    print(f"{'='*50}")
    print(f"\nEndpoints:")
    print(f"  POST /ask     - Simple prompt/response")
    print(f"  POST /chat    - Chat with message history")
    print(f"  GET  /health  - Health check")
    print(f"  GET  /version - API version info")
    print(f"  GET  /docs    - Interactive API documentation")
    print(f"\nConfiguration:")
    print(f"  Host: {HOST}")
    print(f"  Port: {PORT}")
    print(f"  Timeout: {TIMEOUT}s")
    print(f"  CORS: {'enabled' if ENABLE_CORS else 'disabled'}")
    print(f"\nExample:")
    print(f'  curl -X POST http://{HOST}:{PORT}/ask \\')
    print(f'    -H "Content-Type: application/json" \\')
    print(f'    -d \'{{"prompt": "Hello!"}}\'')
    print(f"\n{'='*50}\n")

    uvicorn.run(app, host=HOST, port=PORT)
