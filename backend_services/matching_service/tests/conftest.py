"""Test configuration for pytest"""

import pytest
from app.core.config import settings


@pytest.fixture
def test_client():
    from fastapi.testclient import TestClient
    from main import app

    return TestClient(app)


@pytest.fixture
def algorithm_config():
    from app.models.schemas import AlgorithmConfig

    return AlgorithmConfig()
