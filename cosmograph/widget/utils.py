"""Utility functions for Cosmograph widget including memory caching and data conversion."""

import logging
import os
from joblib import Memory
from pathlib import Path
import pyarrow as pa

logger = logging.getLogger(__name__)

CACHE_DIR_ENVVAR = "COSMOGRAPH_CACHE_DIR"


def cache_dir():
    """Where to keep the Arrow conversion cache.

    Not inside the installed package: site-packages is often read-only, and a
    cache does not belong next to the code anyway. Set `COSMOGRAPH_CACHE_DIR`
    to put it somewhere else.
    """
    chosen = os.environ.get(CACHE_DIR_ENVVAR)
    if chosen:
        return Path(chosen).expanduser()
    xdg_cache = os.environ.get("XDG_CACHE_HOME")
    base = Path(xdg_cache) if xdg_cache else Path.home() / ".cache"
    return base / "cosmograph"


def mk_memory(directory):
    """A joblib cache in `directory`, or an uncached one if we cannot write there.

    A cache that cannot be written is a reason to stop caching, not a reason to
    fail on import.
    """
    try:
        return Memory(directory, verbose=0)  # verbose=1 to debug cache misses
    except OSError as error:
        logger.warning(
            "Not caching Arrow conversions: could not use %s (%s). "
            "Set %s to choose another location.",
            directory,
            error,
            CACHE_DIR_ENVVAR,
        )
        return Memory(None, verbose=0)


CACHE_DIR = cache_dir()
memory = mk_memory(CACHE_DIR)


@memory.cache
def get_buffered_arrow_table(df):
  """Converts a Pandas DataFrame to a buffered Arrow IPC stream format.

  This function is cached using joblib.Memory.
  """

  if df is None:
      return None
  try:
      df_int32 = df.select_dtypes(include=["int64"]).astype("int32")
      df[df_int32.columns] = df_int32
      table = pa.Table.from_pandas(df)
      sink = pa.BufferOutputStream()
      with pa.ipc.new_stream(sink, table.schema) as writer:
          writer.write(table)
      buffer = sink.getvalue()
      return buffer.to_pybytes()
  except Exception as e:
      logger.warning("Failed to convert DataFrame to buffered Arrow table: %s", str(e))
      return None
