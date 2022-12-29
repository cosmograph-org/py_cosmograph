"""
Utils to prepare data for cosmos
"""

from typing import Any, Iterable
import json
from functools import lru_cache, partial
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
js_dir = files / 'js'
js_dir_path = str(js_dir)

import re
from functools import partial
from dol import TextFiles, wrap_kvs, filt_iter, invertible_maps
from dol.sources import AttrContainer

from cosmograph.validation import validate_data


@wrap_kvs(key_of_id=lambda x: x[: -len('.js')], id_of_key=lambda x: x + '.js')
@filt_iter(filt=lambda x: x.endswith('.js'))
class JsFiles(TextFiles):
    """A store of js files"""


_replace_non_alphanumerics_by_underscore = partial(re.compile(r'\W').sub, '_')

# Note: js_files_as_attrs is not used in the module, but can be useful when working
# in a notebook, or console, where we might want the convenience of tab-completion of
# attributes
def js_files_as_attrs(rootdir):
    """
    Will make a JsFiles, but where the keys are available as attributes.
    To do so, any non alphanumerics of file name are replaced with underscore,
    and there can be no two files that collide with that key transformation!
    """
    s = JsFiles(rootdir)
    key_for_id = {id_: _replace_non_alphanumerics_by_underscore(id_) for id_ in s}
    key_for_id, id_for_key = invertible_maps(key_for_id)
    return AttrContainer(
        **wrap_kvs(s, key_of_id=key_for_id.get, id_of_key=id_for_key.get)
    )


# Note: Could replace with js_files_as_attrs, but not sure if it's worth it
mk_js_files = JsFiles

js_files = mk_js_files(str(js_dir_path))


from IPython.display import HTML, Javascript, display


# TODO: How to keep 'cosmos-iife-bundle.js' contents in sink with most recent?
@lru_cache
def get_cosmos_iife_bundle():
    return (js_dir / 'cosmos-iife-bundle.js').read_text()
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
    # TODO: This function should be moved to a better place
    from cosmograph.base import mk_html_code

    display_get_cosmos_iife_bundle()
    html_code = mk_html_code(data)
    html_obj = HTML(html_code)
    fit_view()
    return html_obj


_js_mk_canvas_and_graphs_containers = '''
    window.Canvases = new Map()
    window.Graphs = new Map()
'''

_js_mk_new_canvas_and_cosmos_instance = '''
    window.CreateCanvasAndCosmosById = function (id, height, width) {
        const canvas = document.createElement("canvas")
        canvas.style.height = height;
        canvas.style.width = width;
        Canvases.set(id, canvas)
        const graph = new cosmos.Graph(canvas)
        Graphs.set(id, graph)
    }
'''
_js_mk_api_methods = '''
    window.SetData = function (id, nodes, links) {
        const graph = Graphs.get(id)
        if (graph) graph.setData(nodes, links)
    }
    window.FitView = function (id) {
        const graph = Graphs.get(id)
        if (graph) graph.fitView()
    }
    window.AddCanvasToDivById = function (id) {
        const canvas = Canvases.get(id)
        const divElement = document.querySelector(`#${id}`)
        if (divElement && canvas) {
            divElement.appendChild(canvas)
        }
    }
'''


@lru_cache
def _one_time_setup():
    """Set the JS env up so that the rest of the functions will work.
    Note: Will run only once, even if called multiple times.
    """
    js_source = get_cosmos_iife_bundle()
    display(Javascript(js_source))
    display(Javascript(_js_mk_canvas_and_graphs_containers))
    display(Javascript(_js_mk_new_canvas_and_cosmos_instance))
    display(Javascript(_js_mk_api_methods))


_canvas_ids = (f'canvas_{id_:02.0f}' for id_ in count())
get_new_canvas_id = partial(next, _canvas_ids)

# def get_new_canvas_id():
#     """Gets a new canvas id"""
#     return next(_canvas_ids)

DFLT_CANVAS = get_new_canvas_id()


@lru_cache
def init_cosmos_2(canvas_id=DFLT_CANVAS, canvas_height='400px', canvas_width='100%'):
    _one_time_setup()
    display(
        Javascript(
            f'''
        window.CreateCanvasAndCosmosById("{canvas_id}", "{canvas_height}", "{canvas_width}")
    '''
        )
    )


# This code should only be executed when the python cosmograph library has been imported
def init_cosmos(canvas_height='400px', canvas_width='100%'):
    js_source = get_cosmos_iife_bundle()
    display(Javascript(js_source))
    display(
        Javascript(
            f'''
        // Save cosmosCanvas and cosmosGraph to the global `window` to reuse them later in the JS code
        window.cosmosCanvas = document.createElement("canvas");
        // TODO: The size of the Canvas might be configurable
        window.cosmosCanvas.style.height = "{canvas_height}";
        window.cosmosCanvas.style.width = "{canvas_width}";
        window.cosmosGraph = new cosmos.Graph(cosmosCanvas);
    '''
        )
    )


# init_cosmos()
init_cosmos_2()


def cosmos_html(id_='cosmos'):
    return HTML(
        f'''
        <div id="{id_}"></div>

        <script>
            AddCanvasToDivById("{id_}")
        </script>
    '''
    )


def display_cosmos(id_='cosmos'):
    display(cosmos_html(id_))


def set_data(data, canvas_id=DFLT_CANVAS):
    # TODO: Make the next three lines similar to the ensure_json_string method 😇
    validate_data(data)
    nodes = json.dumps(data['nodes'])
    links = json.dumps(data['links'])

    display(
        Javascript(
            f'''
        if (SetData) SetData("{canvas_id}", {nodes}, {links})
    '''
        )
    )


def fit_view(canvas_id=DFLT_CANVAS):
    display(
        Javascript(
            f'''
        if (FitView) FitView("{canvas_id}")
    '''
        )
    )


def cosmo(links, nodes, canvas_id=None):
    data = {'links': links, 'nodes': nodes}

    if canvas_id is None:
        canvas_id = get_new_canvas_id()
        init_cosmos_2(canvas_id=canvas_id)

    display_cosmos(canvas_id)
    set_data(data, canvas_id)
    fit_view(canvas_id)
    return canvas_id

    # return data_to_html_obj(data)
