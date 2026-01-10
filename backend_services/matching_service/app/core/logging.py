"""Logging configuration"""

import logging
import sys
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure logging based on environment
log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
logger.setLevel(log_level)

# Console handler
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(log_level)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
