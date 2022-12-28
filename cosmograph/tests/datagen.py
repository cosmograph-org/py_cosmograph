"""
A module with a few ready-made data to test on, as well as a few data generators
in view of testing the visualization tools.

https://github.com/cosmograph-org/py_cosmograph/issues/1
"""

from cosmograph.datasrc import mini_dot_to_graph_jdict


class TestData:
    single_link = {
        'nodes': [{'id': '0'}, {'id': '1'}],
        'links': [{'source': '0', 'target': '1'}],
    }

    small_bipartite_graph = mini_dot_to_graph_jdict("""
        1, 2, 3, 4 -> 5, 6, 7
    """)

    pentagon = mini_dot_to_graph_jdict("""
        1 -> 2
        2 -> 3
        3 -> 4
        4 -> 5
        5 -> 1
    """)

    six_path = mini_dot_to_graph_jdict("""
        1 -> 2
        2 -> 3
        3 -> 4
        4 -> 5
        5 -> 6
    """)