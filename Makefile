.PHONY: help install run dev test clean

# Default target
help:
	@echo "Claude API Server - Available Commands"
	@echo ""
	@echo "  make install  - Install dependencies"
	@echo "  make run      - Start the server"
	@echo "  make dev      - Start with auto-reload (development)"
	@echo "  make test     - Run health check test"
	@echo "  make clean    - Remove cache files"
	@echo "  make help     - Show this help message"
	@echo ""

# Install dependencies
install:
	pip install -r requirements.txt

# Run the server
run:
	python claude_api.py

# Run with auto-reload for development
dev:
	uvicorn claude_api:app --reload --host 127.0.0.1 --port 5051

# Run a simple health check test
test:
	@echo "Starting server in background..."
	@python claude_api.py &
	@sleep 2
	@echo "\nTesting /health endpoint..."
	@curl -s http://localhost:5051/health | python -m json.tool
	@echo "\nTesting /version endpoint..."
	@curl -s http://localhost:5051/version | python -m json.tool
	@echo "\nTests complete. Stopping server..."
	@pkill -f "python claude_api.py" || true

# Clean cache files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name "*.log" -delete 2>/dev/null || true
	@echo "Cleaned cache files"
