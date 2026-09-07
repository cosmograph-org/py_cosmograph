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
            dict({point_id_col: node_id(node)}, **attributes)
            for node, attributes in graph.nodes(data=True)
        ),
        columns=[point_id_col],
    )
    links = _frame(
        (
            dict(
                {
                    link_source_col: node_id(source),
                    link_target_col: node_id(target),
                },
                **attributes,
            )
            for source, target, attributes in graph.edges(data=True)
        ),
        columns=[link_source_col, link_target_col],
    )
    return points, links


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
    defaults = {
        "points": points,
        "links": links,
        "point_id_by": DFLT_POINT_ID_COL,
        "link_source_by": DFLT_LINK_SOURCE_COL,
        "link_target_by": DFLT_LINK_TARGET_COL,
    }
    for name, value in defaults.items():
        if kwargs.get(name) is None:
            kwargs[name] = value
    return kwargs


def _frame(rows, columns):
    """A DataFrame of `rows` that still has `columns` when `rows` is empty."""
    frame = pd.DataFrame(rows)
    if frame.empty:
        return pd.DataFrame(columns=columns)
    return frame
