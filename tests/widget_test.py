"""Test the Cosmograph widget's Python-side methods."""

import pandas as pd


def _points_frame():
    return pd.DataFrame(
        {
            "name": ["Dragon Hunt", "Mystic Voyage", "Treasure Seekers"],
            "team": ["red", "blue", "green"],
        }
    )


def _widget(**kwargs):
    """A widget that records what it would have sent to the JS side."""
    from cosmograph import Cosmograph

    widget = Cosmograph(**kwargs)
    widget.sent_messages = []
    widget.send = widget.sent_messages.append
    return widget


def test_request_point_positions_sends_message():
    widget = _widget()
    widget.request_point_positions()
    assert widget.sent_messages == [{"type": "get_point_positions"}]


def test_point_positions_is_none_before_the_widget_answers():
    widget = _widget(points=_points_frame(), point_id_by="name")
    assert widget.point_positions is None


def test_point_positions_pairs_up_the_flat_array():
    widget = _widget(points=_points_frame())

    # What the JS side sends back: [x0, y0, x1, y1, ...]
    widget._point_positions = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]

    positions = widget.point_positions
    assert list(positions.columns) == ["x", "y"]
    assert positions["x"].tolist() == [1.0, 3.0, 5.0]
    assert positions["y"].tolist() == [2.0, 4.0, 6.0]


def test_point_positions_carries_the_ids_when_point_id_by_is_set():
    widget = _widget(points=_points_frame(), point_id_by="name")
    widget._point_positions = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]

    positions = widget.point_positions
    assert list(positions.columns) == ["id", "x", "y"]
    assert positions["id"].tolist() == ["Dragon Hunt", "Mystic Voyage", "Treasure Seekers"]


def test_point_positions_skips_the_ids_when_the_counts_disagree():
    # The widget can be showing fewer/more points than `points` holds, e.g. after
    # the data was swapped out. Better no ids than wrong ones.
    widget = _widget(points=_points_frame(), point_id_by="name")
    widget._point_positions = [1.0, 2.0, 3.0, 4.0]

    positions = widget.point_positions
    assert list(positions.columns) == ["x", "y"]


def test_point_positions_skips_the_ids_when_the_column_is_missing():
    widget = _widget(points=_points_frame(), point_id_by="no_such_column")
    widget._point_positions = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]

    assert list(widget.point_positions.columns) == ["x", "y"]


def test_fetch_point_positions_waits_for_the_answer():
    import asyncio

    widget = _widget(points=_points_frame())

    async def answer_after_the_request():
        # Stand in for the JS side: reply once the request has gone out.
        task = asyncio.ensure_future(widget.fetch_point_positions(timeout=5))
        await asyncio.sleep(0)
        assert widget.sent_messages == [{"type": "get_point_positions"}]
        widget._point_positions = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
        return await task

    positions = asyncio.run(answer_after_the_request())
    assert positions["x"].tolist() == [1.0, 3.0, 5.0]


def test_fetch_point_positions_times_out_when_nobody_answers():
    import asyncio
    import pytest

    widget = _widget(points=_points_frame())

    with pytest.raises(TimeoutError):
        asyncio.run(widget.fetch_point_positions(timeout=0.01))
