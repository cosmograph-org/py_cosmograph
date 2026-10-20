"""Test the Cosmograph widget's Python-side methods."""

import math

import numpy as np
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


def _answer(widget, positions, ids=None, *, request_id=None):
    """Stand in for the JS side answering a request.

    Asks first, as a real answer always follows a request, unless the test names
    the request being answered. The coordinates travel the way the JS sends
    them: one float32 buffer, as a memoryview.
    """
    if request_id is None:
        widget.request_point_positions()
        request_id = widget.sent_messages[-1]["request_id"]
    buffer = memoryview(np.asarray(positions, dtype="<f4").tobytes())
    widget._handle_widget_message(
        widget,
        {"type": "point_positions", "request_id": request_id, "ids": ids},
        [buffer],
    )


def test_request_point_positions_sends_message():
    widget = _widget()
    widget.request_point_positions()
    assert len(widget.sent_messages) == 1
    message = widget.sent_messages[0]
    assert message["type"] == "get_point_positions"
    assert isinstance(message["request_id"], int)


def test_each_request_has_its_own_id():
    widget = _widget()
    widget.request_point_positions()
    widget.request_point_positions()
    first, second = (m["request_id"] for m in widget.sent_messages)
    assert first != second


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


def test_coordinates_are_read_from_the_binary_buffer():
    widget = _widget(points=_points_frame())
    _answer(widget, [0.5, -1.25, 1e6, 2.0])

    positions = widget.point_positions
    assert positions["x"].tolist() == [0.5, 1e6]
    assert positions["y"].tolist() == [-1.25, 2.0]
    assert positions["x"].dtype == np.float32


def test_a_late_answer_to_a_superseded_request_is_dropped():
    widget = _widget(points=_points_frame())
    widget.request_point_positions()
    old = widget.sent_messages[-1]["request_id"]
    widget.request_point_positions()
    new = widget.sent_messages[-1]["request_id"]

    _answer(widget, [9.0, 9.0], ids=["stale"], request_id=old)
    assert widget.point_positions is None

    _answer(widget, [1.0, 2.0], ids=["fresh"], request_id=new)
    assert widget.point_positions["id"].tolist() == ["fresh"]


def test_a_new_request_clears_the_previous_answer():
    widget = _widget(points=_points_frame())
    _answer(widget, [1.0, 2.0])
    widget.request_point_positions()
    assert widget.point_positions is None


def test_replacing_the_data_forgets_positions_and_drops_replies_in_flight():
    widget = _widget(points=_points_frame())
    _answer(widget, [1.0, 2.0])
    widget.request_point_positions()
    in_flight = widget.sent_messages[-1]["request_id"]

    widget.points = _points_frame().iloc[:2]
    _answer(widget, [1.0, 2.0, 3.0, 4.0], request_id=in_flight)
    assert widget.point_positions is None


def test_points_without_finite_coordinates_are_left_out():
    # Before the renderer is ready a point can have no coordinates; it must not
    # come back as a row of NaN.
    widget = _widget(points=_points_frame())
    _answer(widget, [1.0, 2.0, math.nan, 4.0, 5.0, 6.0], ids=["a", "b", "c"])

    positions = widget.point_positions
    assert positions["id"].tolist() == ["a", "c"]
    assert positions.index.tolist() == [0, 1]


def test_an_answer_with_no_buffer_is_an_empty_frame():
    widget = _widget()
    widget.request_point_positions()
    request_id = widget.sent_messages[-1]["request_id"]
    widget._handle_widget_message(
        widget, {"type": "point_positions", "request_id": request_id, "ids": []}, []
    )
    positions = widget.point_positions
    assert positions is not None and len(positions) == 0
