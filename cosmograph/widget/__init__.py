import importlib.metadata
import pathlib

import anywidget
import traitlets
import pyarrow as pa
  

_DEV = False # switch to False for production

if _DEV:
  ESM = "http://localhost:5173/js/widget.ts?anywidget"
  CSS = ""
else:
  ESM = (pathlib.Path(__file__).parent / "static" / "widget.mjs").read_text()
  CSS = (pathlib.Path(__file__).parent / "static" / "style.css").read_text()

try:
    __version__ = importlib.metadata.version("cosmograph")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Cosmograph(anywidget.AnyWidget):
    # Attaches the JS side files
    _esm = ESM
    _css = CSS

    # Variables that the JS side is listening to. For private usage only
    _records_arrow_table_buffer = traitlets.Bytes().tag(sync=True)
    _meta_arrow_table_buffer = traitlets.Bytes().tag(sync=True)

    # Data that Python can observe
    records = traitlets.Any()
    meta = traitlets.Any()

    # Config parameters that Python can observe and the JS side is listening to
    render_links = traitlets.Bool(True).tag(sync=True)
    show_dynamic_labels = traitlets.Bool(True).tag(sync=True)
    # ...

    @traitlets.observe("records")
    def on_records_change(self, change):
      self._records_arrow_table_buffer = self.get_buffered_arrow_table(change.new)

    @traitlets.observe("meta")
    def on_meta_change(self, change):
      self._meta_arrow_table_buffer = self.get_buffered_arrow_table(change.new)

    # Convert a Pandas DataFrame into a binary format and then write it to an IPC (Inter-Process Communication) stream.
    # The `with` statement ensures that the IPC stream is properly closed after writing the data.
    def get_buffered_arrow_table(self, df):
      table = pa.Table.from_pandas(df)
      sink = pa.BufferOutputStream()
      with pa.ipc.new_stream(sink, table.schema) as writer:
         writer.write(table)
      buffer = sink.getvalue()
      return buffer.to_pybytes()
