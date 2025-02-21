"""
A module with a few ready-made data to test on, as well as a few data generators
in view of testing the visualization tools.

https://github.com/cosmograph-org/py_cosmograph/issues/1


"""

# TODO: Figure out how to only need linked for the tests

# from functools import partial

# from linked import mini_dot_to_graph_jdict as _mini_dot_to_graph_jdict


# mini_dot_to_graph_jdict = partial(
#     _mini_dot_to_graph_jdict, field_names={'nodes': 'points'}
# )


# class TestData:
#     single_link = {
#         'nodes': [{'id': '0'}, {'id': '1'}],
#         'links': [{'source': '0', 'target': '1'}],
#     }

#     small_bipartite_graph = mini_dot_to_graph_jdict(
#         """
#         1, 2, 3, 4 -> 5, 6, 7
#     """
#     )

#     pentagon = mini_dot_to_graph_jdict(
#         """
#         1 -> 2
#         2 -> 3
#         3 -> 4
#         4 -> 5
#         5 -> 1
#     """
#     )

#     six_path = mini_dot_to_graph_jdict(
#         """
#         1 -> 2
#         2 -> 3
#         3 -> 4
#         4 -> 5
#         5 -> 6
#     """
#     )


# class MkTestData:
#     def path(self, n):
#         return mini_dot_to_graph_jdict("\n".join(f"{i} -> {i+1}" for i in range(1, n)))

#     def cycle(self, n):
#         return mini_dot_to_graph_jdict(
#             "\n".join(f"{i} -> {i+1}" for i in range(1, n)) + f"\n{n} -> 1"
#         )

#     def bipartite(self, n, m):
#         return mini_dot_to_graph_jdict(
#             "\n".join(
#                 f"{i} -> {j}" for i in range(1, n + 1) for j in range(n + 1, n + m + 1)
#             )
#         )
