# Contributing to Claude API Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Your environment (OS, Python version, Claude CLI version)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the "feature request" label
3. Describe the feature and its use case
4. Explain why it would be valuable

### Submitting Changes

1. Fork the repository
2. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test your changes locally
5. Commit with a clear message:
   ```bash
   git commit -m "Add feature: description of the feature"
   ```
6. Push to your fork and submit a Pull Request

## Code Style Guidelines

### Python

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Keep functions focused and small
- Write docstrings for public functions
- No semicolons (unless absolutely necessary)

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 50 characters
- Reference issues when applicable

### Example

```python
async def process_request(prompt: str) -> str:
    """
    Process a prompt and return the response.

    Args:
        prompt: The user's input prompt

    Returns:
        The processed response string
    """
    # Implementation here
    pass
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README.md if the change affects usage
4. Request review from maintainers
5. Address any feedback

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/claude-api.git
cd claude-api

# Install dependencies
make install

# Run in development mode
make dev
```

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping improve Claude API Server!
