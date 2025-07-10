"""Utility functions for Cosmograph widget including memory caching and data conversion."""

import logging
from joblib import Memory
from pathlib import Path
import pyarrow as pa

# Setup joblib cache
CACHE_DIR = Path(__file__).parent / ".cosmograph_cache"
CACHE_DIR.mkdir(exist_ok=True)
memory = Memory(CACHE_DIR, verbose=0)  # Set verbose=1 for debugging cache misses

logger = logging.getLogger(__name__)


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
