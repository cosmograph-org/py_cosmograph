"""Test cosmograph.widget.utils -- the DataFrame to Arrow IPC conversion."""

import warnings

import pandas as pd
import pyarrow as pa

from cosmograph.widget.utils import get_buffered_arrow_table


def _frame(tag):
    # A distinct frame per test, so joblib's cache never serves an old answer.
    return pd.DataFrame({"id": [f"{tag}-1", f"{tag}-2"], "count": [1, 2], "size": [0.5, 1.5]})


def _table(buffer):
    return pa.ipc.open_stream(pa.BufferReader(pa.py_buffer(buffer))).read_all()


def test_the_callers_dataframe_is_left_alone():
    points = _frame("untouched")
    before = points.dtypes.to_dict()

    get_buffered_arrow_table(points)

    assert points.dtypes.to_dict() == before
    assert points["count"].dtype == "int64"


def test_a_dataframe_slice_does_not_warn():
    # The warning reported in issue #50. It no longer fires on pandas 2.3, but the
    # assignment that caused it is gone now, so keep the guard for older pandas.
    rows = _frame("slice")
    slice_of_rows = rows[rows["count"] > 0]

    with warnings.catch_warnings():
        warnings.simplefilter("error", pd.errors.SettingWithCopyWarning)
        buffer = get_buffered_arrow_table(slice_of_rows)

    assert buffer is not None


def test_int64_columns_still_go_over_the_wire_as_int32():
    buffer = get_buffered_arrow_table(_frame("narrowed"))

    table = _table(buffer)
    assert table.schema.field("count").type == pa.int32()
    assert table.schema.field("size").type == pa.float64()
    assert table.num_rows == 2


def test_none_gives_none():
    assert get_buffered_arrow_table(None) is None
