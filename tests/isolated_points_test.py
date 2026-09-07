"""Test that points with no links survive -- see issue #43."""

import pandas as pd

from cosmograph import cosmo


def _clustered_and_isolated():
    """Two connected pairs plus two points nothing links to."""
    points = pd.DataFrame(
        {
            "id": ["a", "b", "c", "d", "lonely", "also_lonely"],
            "cluster": ["one", "one", "two", "two", "none", "none"],
        }
    )
    links = pd.DataFrame({"source": ["a", "c"], "target": ["b", "d"]})
    return points, links


def test_points_with_no_links_stay_in_the_points_table():
    points, links = _clustered_and_isolated()

    graph = cosmo(
        points=points,
        links=links,
        point_id_by="id",
        link_source_by="source",
        link_target_by="target",
    )

    assert set(graph.points["id"]) == set(points["id"])
    assert "lonely" in set(graph.points["id"])
    assert len(graph.links) == 2


def test_isolated_points_can_be_clustered_like_any_other():
    points, links = _clustered_and_isolated()

    graph = cosmo(
        points=points,
        links=links,
        point_id_by="id",
        link_source_by="source",
        link_target_by="target",
        point_cluster_by="cluster",
    )

    assert graph.point_cluster_by == "cluster"
    assert len(graph.points) == 6
