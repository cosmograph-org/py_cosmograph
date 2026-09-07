"""Test that repeated point ids are caught early -- see issues #24 and #21."""

import pandas as pd
import pytest

from cosmograph import cosmo, Cosmograph
from cosmograph.base import validate_argument_names


def _points(ids):
    return pd.DataFrame({"id": ids, "value": range(len(ids))})


def test_repeated_ids_are_refused():
    with pytest.raises(ValueError, match="repeated value"):
        cosmo(points=_points(["a", "b", "a"]), point_id_by="id")


def test_the_error_names_the_column_and_the_offending_ids():
    with pytest.raises(ValueError) as caught:
        cosmo(points=_points(["a", "b", "a", "c", "b"]), point_id_by="id")

    message = str(caught.value)
    assert "'id'" in message
    assert "'a'" in message and "'b'" in message
    assert "'c'" not in message


def test_long_lists_of_duplicates_are_cut_short():
    repeated = [str(i) for i in range(20)] * 2
    with pytest.raises(ValueError, match="and 15 more"):
        cosmo(points=_points(repeated), point_id_by="id")


def test_unique_ids_are_fine():
    assert isinstance(cosmo(points=_points(["a", "b", "c"]), point_id_by="id"), Cosmograph)


def test_nothing_is_checked_without_point_id_by():
    # No id column named, no claim about uniqueness to make.
    assert isinstance(cosmo(points=_points(["a", "a"])), Cosmograph)


def test_a_missing_id_column_is_not_this_checks_business():
    # point_id_by naming a column that isn't there is a different complaint;
    # this check must not turn it into a confusing one.
    graph = cosmo(points=_points(["a", "b"]), point_id_by="no_such_column")
    assert isinstance(graph, Cosmograph)


def test_the_check_can_be_switched_off():
    graph = cosmo(
        points=_points(["a", "a"]),
        point_id_by="id",
        validate_kwargs=validate_argument_names,
    )
    assert isinstance(graph, Cosmograph)
