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


def _answer(widget, positions, ids=None):
    """Stand in for the JS side answering a request."""
    widget._handle_widget_message(
        widget, {"type": "point_positions", "positions": positions, "ids": ids}
    )


def test_request_point_positions_sends_message():
    widget = _widget()
    widget.request_point_positions()
    assert widget.sent_messages == [{"type": "get_point_positions"}]


def test_point_positions_is_none_before_the_widget_answers():
    widget = _widget(points=_points_frame(), point_id_by="name")
    assert widget.point_positions is None


def test_point_positions_pairs_up_the_flat_array():
    widget = _widget(points=_points_frame())
    _answer(widget, [1.0, 2.0, 3.0, 4.0, 5.0, 6.0])

    positions = widget.point_positions
    assert list(positions.columns) == ["x", "y"]
    assert positions["x"].tolist() == [1.0, 3.0, 5.0]
    assert positions["y"].tolist() == [2.0, 4.0, 6.0]


def test_the_ids_come_from_the_widget_not_from_the_points_table():
    # The widget's point order is its own; taking ids from `points` would line
    # coordinates up with the wrong rows.
    widget = _widget(points=_points_frame(), point_id_by="name")
    _answer(widget, [1.0, 2.0, 3.0, 4.0, 5.0, 6.0], ids=["c", "a", "b"])

    positions = widget.point_positions
    assert list(positions.columns) == ["id", "x", "y"]
    assert positions["id"].tolist() == ["c", "a", "b"]


def test_no_id_column_when_the_widget_sends_no_ids():
    widget = _widget(points=_points_frame())
    _answer(widget, [1.0, 2.0], ids=None)
    assert list(widget.point_positions.columns) == ["x", "y"]


def test_a_graph_with_no_points_answers_with_an_empty_frame_not_none():
    # "asked and there is nothing" has to be distinguishable from "never asked".
    widget = _widget()
    _answer(widget, [], ids=[])

    positions = widget.point_positions
    assert positions is not None
    assert len(positions) == 0
    assert list(positions.columns) == ["x", "y"]


def test_asking_twice_for_an_unchanged_layout_answers_twice():
    # A settled graph gives the same numbers every time. A synced trait would stay
    # quiet on the second answer, because traitlets does not fire on an equal value;
    # a message does not have that problem.
    widget = _widget(points=_points_frame())
    same = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]

    _answer(widget, same, ids=["a", "b", "c"])
    first = widget.point_positions
    _answer(widget, same, ids=["a", "b", "c"])
    second = widget.point_positions

    assert first.equals(second)
    assert second["id"].tolist() == ["a", "b", "c"]
