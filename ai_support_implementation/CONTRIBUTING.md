# Contributing to AI Support System

Thank you for your interest in contributing to the AI Support System! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose
- Git
- Make (optional, for using Makefile commands)

### Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/tripo04os-ai-support.git
cd tripo04os-ai-support
```

2. **Create a virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
make install
# or
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

4. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start development services**

```bash
make compose-up
# or
docker-compose up -d
```

6. **Initialize the database**

```bash
make db-init
# or
python -c "from database import init_database; import asyncio; asyncio.run(init_database())"
```

7. **Run the development server**

```bash
make dev
# or
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical fixes for production

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Write code following our [Coding Standards](#coding-standards)
2. Add tests following our [Testing Guidelines](#testing-guidelines)
3. Update documentation as needed
4. Run tests and linting

```bash
make test
make lint
make format
```

### Committing Changes

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(ai): add sentiment analysis for messages

Implement sentiment analysis using VADER library to detect
user emotions in support conversations.

Closes #123
```

```
fix(api): resolve memory leak in WebSocket handler

Fixed issue where WebSocket connections were not properly
closed, causing memory leaks over time.

Fixes #456
```

### Pushing and Creating a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub following our [Pull Request Process](#pull-request-process).

## Coding Standards

### Python Style Guide

We follow PEP 8 and use the following tools:

- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking
- **pylint** for additional code quality checks

### Code Formatting

Before committing, run:

```bash
make format
# or
black .
isort .
```

### Type Hints

All functions should include type hints:

```python
from typing import Optional, List

async def process_message(
    conversation_id: str,
    message: str,
    message_type: str,
    user_id: str
) -> dict:
    """Process a user message and generate AI response."""
    # Implementation
```

### Documentation

All functions and classes should have docstrings:

```python
def classify_intent(self, message: str) -> dict:
    """
    Classify the intent of a user message.

    Args:
        message: The user message to classify.

    Returns:
        A dictionary containing:
            - intent: The classified intent (str)
            - confidence: Confidence score (float, 0-1)

    Raises:
        ValueError: If the message is empty or invalid.
    """
    # Implementation
```

### Error Handling

Always handle exceptions appropriately:

```python
try:
    result = await some_async_operation()
except DatabaseError as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(
        status_code=500,
        detail="Internal server error"
    )
```

### Logging

Use structured logging:

```python
import logging

logger = logging.getLogger(__name__)

logger.info("Processing message", extra={
    "conversation_id": conversation_id,
    "message_length": len(message)
})
```

## Testing Guidelines

### Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── test_ai_engine.py        # AI engine tests
├── test_api.py              # API endpoint tests
├── test_integration.py       # Integration tests
├── test_database.py         # Database tests
└── test_utils.py            # Utility function tests
```

### Writing Tests

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete user workflows

Example:

```python
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_classify_intent():
    """Test intent classification."""
    engine = AIEngine(db_session=AsyncMock(), ...)
    result = await engine.classify_intent("I need a refund")
    
    assert result is not None
    assert "intent" in result
    assert result["confidence"] > 0.5
```

### Running Tests

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run integration tests only
make test-integration

# Run with coverage
make test-coverage

# Run specific test file
pytest tests/test_ai_engine.py -v

# Run specific test
pytest tests/test_ai_engine.py::TestAIEngine::test_classify_intent -v
```

### Test Coverage

Maintain at least 80% code coverage:

```bash
make test-coverage
# View coverage report in htmlcov/index.html
```

## Documentation

### Code Documentation

- All public functions must have docstrings
- Use Google-style docstrings
- Include type hints

### Project Documentation

Documentation is generated using pdoc:

```bash
make docs
# View docs in docs/index.html
```

### README Updates

When adding features, update:
- Feature list in README
- Installation instructions if needed
- Configuration examples
- API documentation

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines (`make format`, `make lint`)
- [ ] Tests pass (`make test`)
- [ ] Coverage is maintained or improved
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] PR description includes:
  - Purpose of the change
  - Description of changes
  - Related issues
  - Screenshots for UI changes (if applicable)

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123, #456

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests pass
- [ ] Code is formatted
- [ ] Documentation updated
```

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address all review comments
4. Update PR as needed

### Merging

After approval:

1. Squash and merge commits
2. Delete feature branch
3. Update changelog

## Issue Reporting

### Bug Reports

Include:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Python version, etc.)
- Logs or error messages
- Screenshots (if applicable)

### Feature Requests

Include:

- Description of the feature
- Use case or motivation
- Proposed implementation (if known)
- Alternatives considered

## Questions?

- Check existing documentation
- Search existing issues
- Ask in discussions or create a new issue

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to the AI Support System! 🚀
