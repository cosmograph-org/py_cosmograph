"""Translate third-party graph objects into the points/links tables cosmograph wants.

Cosmograph takes two tables: one row per point, one row per link. Plenty of graph
libraries hold the same information in their own object, so this module holds the
converters. Right now that means networkx; see
https://github.com/cosmograph-org/py_cosmograph/issues/4 for the other formats
people have asked about.
"""

import sys

import pandas as pd

DFLT_POINT_ID_COL = "id"
DFLT_LINK_SOURCE_COL = "source"
DFLT_LINK_TARGET_COL = "target"


def is_networkx_graph(obj) -> bool:
    """Is `obj` a networkx graph?

    Asks without importing networkx: if networkx was never imported, nothing in
    this process can be one of its graphs.

    >>> is_networkx_graph({'a': ['b']})
    False
    >>> import networkx as nx
    >>> is_networkx_graph(nx.path_graph(3))
    True
    """
    networkx = sys.modules.get("networkx")
    if networkx is None:
        return False
    # DiGraph, MultiGraph and MultiDiGraph all subclass Graph
    return isinstance(obj, networkx.Graph)


def networkx_to_points_and_links(
    graph,
    *,
    node_id=str,
    point_id_col: str = DFLT_POINT_ID_COL,
    link_source_col: str = DFLT_LINK_SOURCE_COL,
    link_target_col: str = DFLT_LINK_TARGET_COL,
):
    """Split a networkx graph into a (points, links) pair of DataFrames.

    Node and edge attributes come along as extra columns, so anything you stored
    on the graph can be used for color, size, labels, and so on. Nodes with no
    edges still get a point row.

    Args:
        graph: A networkx Graph, DiGraph, MultiGraph or MultiDiGraph.
        node_id: How to turn a networkx node into a point id. Defaults to `str`,
            since networkx nodes can be tuples or arbitrary objects while
            cosmograph wants something it can put in a column.
        point_id_col: Name for the point id column.
        link_source_col: Name for the link source column.
        link_target_col: Name for the link target column.

    Returns:
        A `(points, links)` tuple of DataFrames.

    >>> import networkx as nx
    >>> graph = nx.Graph()
    >>> graph.add_node('a', team='red')
    >>> graph.add_edge('a', 'b', weight=2.5)
    >>> points, links = networkx_to_points_and_links(graph)
    >>> list(points.columns)
    ['id', 'team']
    >>> points['id'].tolist()
    ['a', 'b']
    >>> links[['source', 'target', 'weight']].values.tolist()
    [['a', 'b', 2.5]]
    """
    points = _frame(
        (
            _row({point_id_col: node_id(node)}, attributes, "node")
            for node, attributes in graph.nodes(data=True)
        ),
        columns=[point_id_col],
    )
    links = _frame(
        (
            _row(
                {
                    link_source_col: node_id(source),
                    link_target_col: node_id(target),
                },
                attributes,
                "edge",
            )
            for source, target, attributes in graph.edges(data=True)
        ),
        columns=[link_source_col, link_target_col],
    )
    _refuse_collapsed_ids(points[point_id_col], graph, node_id)
    return _settle_mixed_columns(points), _settle_mixed_columns(links)


def networkx_cosmo_kwargs(graph, **kwargs):
    """The `cosmo` keyword arguments that draw `graph`.

    Fills in `points`, `links` and the column names, leaving alone anything the
    caller already decided.

    >>> import networkx as nx
    >>> kwargs = networkx_cosmo_kwargs(nx.path_graph(3))
    >>> kwargs['point_id_by'], kwargs['link_source_by'], kwargs['link_target_by']
    ('id', 'source', 'target')
    >>> len(kwargs['points']), len(kwargs['links'])
    (3, 2)
    """
    points, links = networkx_to_points_and_links(graph)
    defaults = {"points": points, "point_id_by": DFLT_POINT_ID_COL}
    if len(links) > 0:
        # A graph with no edges gets no links table: an empty one reaches the
        # widget as an Arrow schema whose source/target columns are all null.
        defaults.update(
            links=links,
            link_source_by=DFLT_LINK_SOURCE_COL,
            link_target_by=DFLT_LINK_TARGET_COL,
        )
    for name, value in defaults.items():
        if kwargs.get(name) is None:
            kwargs[name] = value
    return kwargs


def _row(structure, attributes, kind):
    """One table row: the structural columns plus the attributes.

    An attribute sharing a name with a structural column would quietly replace
    the node or edge it is meant to describe, and nothing downstream could tell.
    """
    collisions = sorted(set(structure) & set(attributes))
    if collisions:
        names = ", ".join(map(repr, collisions))
        raise ValueError(
            f"The graph has {kind} attribute(s) named {names}, which is what the "
            f"id/source/target column(s) are called. Rename the attribute, or pass "
            f"point_id_col=, link_source_col= or link_target_col= to move the "
            f"structural column out of the way."
        )
    return dict(structure, **attributes)


def _refuse_collapsed_ids(ids, graph, node_id):
    """Refuse a `node_id` that gives two nodes the same point id.

    networkx nodes are distinct by definition, so a repeated point id can only
    mean `node_id` lost the difference between two of them -- the default `str`
    does exactly that to `1` and `"1"`. Cosmograph draws one point per id, so
    the two would become one point and their links would land on it together.
    """
    if not ids.duplicated().any():
        return

    by_id = {}
    for node in graph.nodes():
        by_id.setdefault(node_id(node), []).append(node)
    collapsed = {name: nodes for name, nodes in by_id.items() if len(nodes) > 1}

    shown = "; ".join(
        f"{name!r} <- {', '.join(map(repr, nodes))}"
        for name, nodes in list(collapsed.items())[:3]
    )
    if len(collapsed) > 3:
        shown += f"; and {len(collapsed) - 3} more"
    raise ValueError(
        f"node_id gave the same point id to different nodes: {shown}. "
        f"Cosmograph draws one point per id, so those nodes would end up as one "
        f"point with each other's links. Pass a node_id= that tells them apart."
    )


def _settle_mixed_columns(frame):
    """Make any column holding more than one type into strings.

    networkx attributes are per node and per edge, so a column can hold an int
    for one node and a string for another. Arrow will not take that, and the
    widget's conversion turns the refusal into an empty graph.
    """
    for column in frame.columns:
        if frame[column].dtype != object:
            continue
        types = {type(value) for value in frame[column] if value is not None}
        if len(types) > 1:
            frame[column] = frame[column].map(
                lambda value: value if value is None else str(value)
            )
    return frame


def _frame(rows, columns):
    """A DataFrame of `rows` that still has `columns` when `rows` is empty."""
    frame = pd.DataFrame(rows)
    if frame.empty:
        return pd.DataFrame(columns=columns)
    return frame
