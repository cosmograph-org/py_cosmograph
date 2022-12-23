"""
Utils to prepare data for cosmos
"""

from typing import Any, Iterable
import json

DFLT_JSON_INDENT = None  # TODO: should we put an indent (easier to read but many lines)

html_code_data_def_template = '''
<div>
    <canvas></canvas>
</div>

<script>
    const data = {json_data_str}
    const canvas = document.querySelector("canvas");
    const graph = new cosmos.Graph(canvas);
</script>
'''


def is_valid_json_str(obj: str) -> bool:
    try:
        json.loads(obj)
        return True
    except Exception:
        return False


def is_nodes(nodes: Iterable[dict]) -> bool:
    return isinstance(nodes, Iterable) and all(map(is_node, nodes))


def is_node(node: dict) -> bool:
    return isinstance(node, dict) and 'id' in node


def is_links(links: Iterable[dict]) -> bool:
    return isinstance(links, Iterable) and all(map(is_link, links))


def is_link(link: dict) -> bool:
    return isinstance(link, dict) and 'source' in link and 'target' in link


def validate_data(data: dict) -> None:
    assert 'nodes' in data, "data doesn't have a nodes field"
    assert 'links' in data, "data doesn't have a links field"
    assert is_nodes(
        data['nodes']
    ), 'the "nodes" field does not contain valid a nodes specification'
    assert is_links(
        data['links']
    ), 'the "links" field does not contain valid a links specification'


def ensure_json_string(data, *, indent=DFLT_JSON_INDENT, strong_validation=False):
    if isinstance(data, dict):
        validate_data(data)
        data = json.dumps(data, indent=indent)
    if strong_validation:
        validate_data(json.loads(data))
    else:
        assert isinstance(data, str)
    return data


def mk_html_code(data):
    data = ensure_json_string(data)
    return html_code_data_def_template.format(json_data_str=data)
