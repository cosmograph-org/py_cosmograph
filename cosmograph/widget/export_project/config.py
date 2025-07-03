"""Configuration settings and logger setup for the Cosmograph export module."""
import logging
import sys

API_BASE = "https://run.cosmograph.app/api/trpc"
logger = logging.getLogger(__name__)

logging.basicConfig(
  level=logging.INFO,
  format='%(levelname)s - %(message)s',
  stream=sys.stdout
)
