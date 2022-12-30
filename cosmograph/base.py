"""Base functionality of cosmograph"""

from typing import List, Optional, Tuple
from pydantic import BaseModel

NodeId = str  # TODO: Also include ints? Oblige ids to be valid python identifiers?


class Node(BaseModel):
    id: NodeId


class Link(BaseModel):
    source: NodeId
    target: NodeId


# TODO: Find a way to make these have a .validate (with pydantic)
Nodes = List[Node]
Links = List[Link]


class GraphJson(BaseModel):
    links: Links
    nodes: Nodes = []


from cosmograph.validation import ensure_json_string


html_code_data_def_template = '''
<div>
    <canvas></canvas>
</div>

<script>
    const data = {json_data_str}
    const canvas = document.querySelector("canvas");
    const graph = new cosmos.Graph(canvas);
    graph.setData(data.nodes, data.links);
    graph.fitView();
</script>
'''

# TODO: Function should be moved to a better place
def mk_html_code(data):
    data = ensure_json_string(data)
    return html_code_data_def_template.format(json_data_str=data)
