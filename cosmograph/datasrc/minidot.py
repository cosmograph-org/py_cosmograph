"""
mini-dot: A very simple mini-language resembling graphviz dot
"""

from operator import methodcaller
from functools import partial
from itertools import product, chain
from typing import Iterable
from i2 import Pipe
import re

comment_marker = r'#'
to_and_from_nodes_sep = '->'
node_regular_expression = r'\w+'

iterize = lambda func: partial(map, func)

remove_comments = Pipe(
    re.compile(f'[^{comment_marker}]*').match,
    methodcaller('group', 0)
)
split_to_and_from_nodes = methodcaller('split', to_and_from_nodes_sep)
extract_nodes = re.compile(node_regular_expression).findall

process_one_line = Pipe(
    source_and_target_lists_str=split_to_and_from_nodes,
    source_and_target_lists=Pipe(iterize(extract_nodes), list),
    generate_all_combinations=lambda x: product(*x),
)

get_source_target_pairs = Pipe(
    lines=lambda x: str.splitlines(x),
    remove_comments=iterize(remove_comments),
    filter_out_empty_lines=partial(filter, None),
    process_lines=iterize(process_one_line),
    chain=chain.from_iterable
)


def source_target_pairs_to_graph_jdict(source_target_pairs: Iterable):
    nodes = []
    links = []
    _nodes = set(nodes)

    def add_node_if_not_already_there(node):
        if node not in _nodes:
            nodes.append(node)
            _nodes.add(node)

    for source, target in source_target_pairs:
        add_node_if_not_already_there(source)
        add_node_if_not_already_there(target)
        links.append({"source": source, "target": target})

    return {
        "nodes": [{"id": node} for node in nodes],
        "links": links
    }


def mini_dot_to_graph_jdict(mini_dot: str):
    pairs = get_source_target_pairs(mini_dot)
    return source_target_pairs_to_graph_jdict(pairs)
