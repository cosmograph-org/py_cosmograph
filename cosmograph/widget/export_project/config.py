"""Configuration settings and logger setup for the Cosmograph export module."""
import logging
import sys

API_BASE = "https://run.cosmograph.app/api/trpc"
logger = logging.getLogger(__name__)


# Configure logger with a handler that flushes stdout immediately
# This ensures logs appear in Colab notebooks (which may buffer output differently)
# Force flush stdout after each log message to ensure output appears in Colab
class FlushingStreamHandler(logging.StreamHandler):
    """A StreamHandler that flushes stdout after each log message."""
    def emit(self, record):
        super().emit(record)
        self.stream.flush()


if not logger.handlers:
    formatter = logging.Formatter('%(levelname)s - %(message)s')
    flushing_handler = FlushingStreamHandler(sys.stdout)
    flushing_handler.setLevel(logging.INFO)
    flushing_handler.setFormatter(formatter)
    logger.addHandler(flushing_handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False  # Prevent duplicate logs from root logger
