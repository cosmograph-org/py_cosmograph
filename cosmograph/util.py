"""
Utils to prepare data for cosmos
"""

from typing import Any, Iterable
import json
from functools import lru_cache
from itertools import count

try:
    import importlib.resources

    _files = importlib.resources.files  # only valid in 3.9+
except AttributeError:
    import importlib_resources  # needs pip install

    _files = importlib_resources.files

files = _files('cosmograph')
data_dir = files / 'data'
data_dir_path = str(data_dir)


DFLT_JSON_INDENT = None  # TODO: should we put an indent (easier to read but many lines)

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


from IPython.display import HTML, Javascript, display


# TODO: How to keep 'cosmos-iife-bundle.js' contents in sink with most recent?
@lru_cache
def get_cosmos_iife_bundle():
    return (data_dir / 'cosmos-iife-bundle.js').read_text()
    # import requests
    # root_url = "https://github.com/cosmograph-org/cosmos-integrations/"
    # cosmos_iife_bundle_url=(
    #     root_url + "blob/feature/jupyter/packages/cosmos-jupyter/cosmos-iife-bundle.js"
    # )
    # r = requests.get(cosmos_iife_bundle_url)
    # if r.status_code == 200:
    #     return r.content.decode()
    # else:
    #     raise RuntimeError("Couldn't get the cosmos_iife_bundle JS from the web.")


@lru_cache  # TODO: Only run this once, really?
def display_get_cosmos_iife_bundle():
    js_source = get_cosmos_iife_bundle()
    display(Javascript(js_source))


def data_to_html_obj(data):
    display_get_cosmos_iife_bundle()
    html_code = mk_html_code(data)
    html_obj = HTML(html_code)
    fit_view()
    return html_obj


_js_mk_canvas_and_graphs_containers = """
    window.Canvases = new Map()
    window.Graphs = new Map()
"""

@lru_cache
def _one_time_setup():
    """Set the JS env up so that the rest of the functions will work.
    Note: Will run only once, even if called multiple times.
    """
    js_source = get_cosmos_iife_bundle()
    display(Javascript(js_source))
    display(Javascript(_js_mk_canvas_and_graphs_containers))


_canvas_ids = (f'canvas_{id_:02.0f}' for id_ in count())


def get_new_canvas_id():
    """Gets a new canvas id"""
    return next(_canvas_ids)

DFLT_CANVAS = get_new_canvas_id()

@lru_cache
def init_cosmos_2(
        canvas_id=DFLT_CANVAS, canvas_height="400px", canvas_width="100%"
):
    _one_time_setup()
    display(Javascript(f"""
        // Save cosmosCanvas and cosmosGraph to the global `window` to reuse them later in the JS code
        window.cosmosCanvas = document.createElement("canvas");
        window.cosmosCanvas.style.height = "{canvas_height}";
        window.cosmosCanvas.style.width = "{canvas_width}";
        window.Canvases["{canvas_id}"] = window.cosmosCanvas
        window.cosmosGraph = new cosmos.Graph(cosmosCanvas);
        window.Graphs["{canvas_id}"] = window.cosmosGraph
    """))

# This code should only be executed when the python cosmograph library has been imported
def init_cosmos(canvas_height="400px", canvas_width="100%"):
    js_source = get_cosmos_iife_bundle()
    display(Javascript(js_source))
    display(Javascript(f"""
        // Save cosmosCanvas and cosmosGraph to the global `window` to reuse them later in the JS code
        window.cosmosCanvas = document.createElement("canvas");
        // TODO: The size of the Canvas might be configurable
        window.cosmosCanvas.style.height = "{canvas_height}";
        window.cosmosCanvas.style.width = "{canvas_width}";
        window.cosmosGraph = new cosmos.Graph(cosmosCanvas);
    """))

# init_cosmos()
init_cosmos_2()

def cosmos_html(id_='cosmos'):
    return HTML(f"""
        <div id="{id_}"></div>

        <script>
            document.querySelector("#{id_}").appendChild(cosmosCanvas);
        </script>
    """)


def display_cosmos(id_='cosmos'):
    display(cosmos_html(id_))


def set_data(data, canvas_id=DFLT_CANVAS):
    # TODO: Make the next three lines similar to the ensure_json_string method 😇
    validate_data(data)
    nodes = json.dumps(data['nodes'])
    links = json.dumps(data['links'])

    display(Javascript(f'''
        cosmosGraph = window.Graphs["{canvas_id}"]
        cosmosGraph.setData({nodes}, {links})
    '''))


def fit_view(canvas_id=DFLT_CANVAS):
    display(Javascript(f'''
        cosmosGraph = window.Graphs["{canvas_id}"]
        cosmosGraph.fitView()
    '''))



def cosmo(links, nodes, canvas_id=None):
    data = {'links': links, 'nodes': nodes}

    if canvas_id is None:
        canvas_id = get_new_canvas_id()
        init_cosmos_2(canvas_id=canvas_id)

    display_cosmos()
    set_data(data, canvas_id)
    fit_view(canvas_id)
    return canvas_id


    # return data_to_html_obj(data)