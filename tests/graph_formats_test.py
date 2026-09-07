"""Test cosmograph.graph_formats -- turning third-party graph objects into tables."""

import networkx as nx
import pytest

from cosmograph.graph_formats import (
    is_networkx_graph,
    networkx_to_points_and_links,
)


def test_is_networkx_graph():
    assert is_networkx_graph(nx.Graph())
    assert is_networkx_graph(nx.DiGraph())
    assert is_networkx_graph(nx.MultiDiGraph())
    assert not is_networkx_graph({"a": ["b"]})
    assert not is_networkx_graph(None)


def test_node_and_edge_attributes_become_columns():
    graph = nx.Graph()
    graph.add_node("a", team="red", weight=1)
    graph.add_node("b", team="blue", weight=2)
    graph.add_edge("a", "b", kind="knows", strength=0.5)

    points, links = networkx_to_points_and_links(graph)

    assert list(points.columns) == ["id", "team", "weight"]
    assert points["id"].tolist() == ["a", "b"]
    assert points["team"].tolist() == ["red", "blue"]

    assert list(links.columns) == ["source", "target", "kind", "strength"]
    assert links["source"].tolist() == ["a"]
    assert links["target"].tolist() == ["b"]
    assert links["strength"].tolist() == [0.5]


def test_isolated_nodes_get_a_point_row():
    # A graph can be part clusters, part loners -- the loners are still points.
    graph = nx.Graph()
    graph.add_edge("a", "b")
    graph.add_node("alone")

    points, links = networkx_to_points_and_links(graph)

    assert set(points["id"]) == {"a", "b", "alone"}
    assert len(links) == 1


def test_a_graph_with_no_edges_still_has_the_link_columns():
    points, links = networkx_to_points_and_links(nx.Graph([("a", "b")][:0]))
    assert list(links.columns) == ["source", "target"]
    assert len(links) == 0


def test_node_ids_are_stringified_by_default():
    # networkx nodes are often ints or tuples; cosmograph wants column values.
    points, links = networkx_to_points_and_links(nx.path_graph(3))
    assert points["id"].tolist() == ["0", "1", "2"]
    assert links["source"].tolist() == ["0", "1"]


def test_node_id_is_the_seam_for_other_id_schemes():
    points, _ = networkx_to_points_and_links(nx.path_graph(3), node_id=lambda n: f"n{n}")
    assert points["id"].tolist() == ["n0", "n1", "n2"]


def test_column_names_are_configurable():
    points, links = networkx_to_points_and_links(
        nx.path_graph(2),
        point_id_col="node",
        link_source_col="from",
        link_target_col="to",
    )
    assert list(points.columns) == ["node"]
    assert list(links.columns) == ["from", "to"]


def test_directed_and_multi_graphs_work():
    digraph = nx.DiGraph([("a", "b"), ("b", "a")])
    _, links = networkx_to_points_and_links(digraph)
    assert len(links) == 2

    multigraph = nx.MultiGraph()
    multigraph.add_edge("a", "b")
    multigraph.add_edge("a", "b")
    _, links = networkx_to_points_and_links(multigraph)
    assert len(links) == 2


def test_cosmo_takes_a_networkx_graph_directly():
    from cosmograph import cosmo, Cosmograph

    graph = cosmo(nx.karate_club_graph())

    assert isinstance(graph, Cosmograph)
    assert len(graph.points) == 34
    assert len(graph.links) == 78
    assert graph.point_id_by == "id"
    assert graph.link_source_by == "source"
    assert graph.link_target_by == "target"
    # Node attributes came along, so they can be used for color etc.
    assert "club" in graph.points.columns


def test_cosmo_leaves_the_column_names_you_chose_alone():
    from cosmograph import cosmo

    graph = cosmo(nx.path_graph(3), point_color_by="id", point_label_by="id")
    assert graph.point_color_by == "id"
    assert graph.point_label_by == "id"


def test_cosmo_complains_about_a_graph_plus_points_or_links():
    import pandas as pd
    from cosmograph import cosmo

    with pytest.raises(ValueError, match="networkx graph"):
        cosmo(nx.path_graph(3), points=pd.DataFrame({"id": ["a"]}))


def test_an_attribute_named_like_a_structural_column_is_refused():
    # Letting the attribute win would replace the node it describes, and nothing
    # downstream could tell that the graph had been rewired.
    graph = nx.Graph()
    graph.add_node("a", id="something else")

    with pytest.raises(ValueError, match="attribute\\(s\\) named 'id'"):
        networkx_to_points_and_links(graph)


def test_the_error_points_at_the_argument_that_fixes_it():
    graph = nx.Graph()
    graph.add_edge("a", "b", source="elsewhere")

    with pytest.raises(ValueError, match="link_source_col"):
        networkx_to_points_and_links(graph)

    # ...and doing what it says works
    _, links = networkx_to_points_and_links(graph, link_source_col="from")
    assert list(links.columns) == ["from", "target", "source"]


def test_a_mixed_type_attribute_still_reaches_the_widget():
    # networkx attributes are per node, so a column can hold an int for one and a
    # string for another. Arrow refuses that, and the widget turns a refusal into
    # an empty graph.
    from cosmograph import cosmo

    graph = nx.Graph()
    graph.add_node("a", note=1)
    graph.add_node("b", note="two")
    graph.add_edge("a", "b")

    points, _ = networkx_to_points_and_links(graph)
    assert points["note"].tolist() == ["1", "two"]
    assert cosmo(graph)._ipc_points is not None


def test_a_graph_with_no_edges_ships_no_links_table():
    # An empty links table reaches the widget as all-null Arrow columns.
    from cosmograph import cosmo

    graph = nx.Graph()
    graph.add_nodes_from(["a", "b", "c"])

    widget = cosmo(graph)
    assert len(widget.points) == 3
    assert widget.links is None
    assert widget.link_source_by is None


def test_networkx_is_not_imported_unless_you_use_it():
    # The promise is that networkx stays optional. Check it in a fresh process,
    # since this test module imports networkx itself.
    import subprocess
    import sys

    script = (
        "import sys, pandas as pd\n"
        "from cosmograph import cosmo\n"
        "cosmo(points=pd.DataFrame({'id': ['a', 'b']}), point_id_by='id')\n"
        "assert 'networkx' not in sys.modules, sorted(sys.modules)\n"
        "print('ok')\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", script], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr
    assert "ok" in result.stdout
