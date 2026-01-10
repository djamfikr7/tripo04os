"""Application initialization"""

from app.api.routes import api_router
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_application():
    return api_router
