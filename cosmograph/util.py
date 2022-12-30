"""
Utils to prepare data for cosmos
"""

from typing import Any, Iterable
import json
from functools import lru_cache, partial
from itertools import count
import re

from IPython.display import HTML, Javascript, display as ipython_display
from dol import (
    TextFiles,
    wrap_kvs,
    filt_iter,
    invertible_maps,
    add_ipython_key_completions,
    Pipe,
)
from dol.sources import AttrContainer

from cosmograph.validation import validate_data

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


def _postprocess(func, egress):
    return Pipe(func, egress)


postprocess = lambda egress: partial(_postprocess, egress=egress)
display_output = postprocess(ipython_display)
to_html_obj = postprocess(HTML)
to_js_obj = postprocess(Javascript)

# TODO: Overriding the previous definitions to test an alternative approach
#  based on gathering strings and feeding to HTML element at the end only.
#  Should delete display_output, to_js_obj, to_html_obj and uses once decided to
#  use new approach.
display_output, to_js_obj, to_html_obj = [lambda x: x] * 3


@add_ipython_key_completions
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


@display_output
@to_js_obj
@lru_cache  # TODO: Only run this once, really?
def display_get_cosmos_iife_bundle():
    return get_cosmos_iife_bundle()


def data_to_html_obj(data):
    # TODO: This function should be moved to a better place
    from cosmograph.base import mk_html_code

    display_get_cosmos_iife_bundle()
    html_code = mk_html_code(data)
    html_obj = HTML(html_code)
    fit_view()
    return html_obj


_js_mk_canvas_and_graphs_containers = js_files['mk_canvas_and_graphs_containers']
_js_mk_new_canvas_and_cosmos_instance = js_files['mk_new_canvas_and_cosmos_instance']
_js_mk_api_methods = js_files['mk_api_methods']


_canvas_ids = (f'canvas_{id_:02.0f}' for id_ in count())
get_new_canvas_id = partial(next, _canvas_ids)

# def get_new_canvas_id():
#     """Gets a new canvas id"""
#     return next(_canvas_ids)

DFLT_CANVAS = get_new_canvas_id()


@display_output
@to_js_obj
@lru_cache
def _one_time_setup():
    """Set the JS env up so that the rest of the functions will work.
    Note: Will run only once, even if called multiple times.
    """
    js_code = '\n\n'.join(
        [
            get_cosmos_iife_bundle(),
            js_files['mk_canvas_and_graphs_containers'],
            js_files['mk_new_canvas_and_cosmos_instance'],
            js_files['mk_api_methods'],
        ]
    )
    return js_code


ipython_display(Javascript(_one_time_setup()))


@display_output
@to_js_obj
@lru_cache
def init_cosmos(canvas_id=DFLT_CANVAS, canvas_height='400px', canvas_width='100%'):
    return f'''
        window.CreateCanvasAndCosmosById("{canvas_id}", "{canvas_height}", "{canvas_width}")
    '''


@display_output
@to_html_obj
def cosmos_html(cosmo_id='cosmos'):
    return f'''
        <div id="{cosmo_id}"></div>

        <script>
            AddCanvasToDivById("{cosmo_id}")
        </script>
    '''


@display_output
@to_js_obj
def set_data(data, canvas_id=DFLT_CANVAS):
    # TODO: Make the next three lines similar to the ensure_json_string method 😇
    validate_data(data)
    nodes = json.dumps(data['nodes'])
    links = json.dumps(data['links'])

    return f'if (SetData) SetData("{canvas_id}", {nodes}, {links})'


@display_output
@to_js_obj
def fit_view(canvas_id=DFLT_CANVAS):
    return f'if (FitView) FitView("{canvas_id}")'


def ordered_unique(iterable):
    seen = set()
    seen_add = seen.add
    return (x for x in iterable if not (x in seen or seen_add(x)))


def _nodes_from_links(links):
    def _yield_nodes_from_links():
        for link in links:
            yield link['source']
            yield link['target']

    return [{'id': x} for x in ordered_unique(_yield_nodes_from_links(links))]


from cosmograph.validation import is_links, is_graph_json


def _ensure_cosmo_data(links, nodes=None):
    if nodes is None:
        if is_graph_json(links):
            return links
        elif is_links(links):
            nodes = _nodes_from_links(links)
    return {'links': links, 'nodes': nodes}


canvas_ids_used = []


def _cosmos_html(cosmo_id='cosmos', pre_script='', post_script=''):
    return f'''
        <div id="{cosmo_id}"></div>

        <script>
            {pre_script}
            AddCanvasToDivById("{cosmo_id}")
            {post_script}
        </script>
    '''


def cosmo(links, nodes=None, canvas_id=None, *, display=False):
    data = _ensure_cosmo_data(links, nodes)

    if canvas_id is None:
        canvas_id = get_new_canvas_id()

    html_str = _cosmos_html(
        canvas_id,
        pre_script=init_cosmos(canvas_id=canvas_id),
        post_script=set_data(data, canvas_id),
    )

    html_obj = HTML(html_str)
    html_obj.canvas_id = canvas_id

    # fit_view(canvas_id)  # doesn't work
    if canvas_id not in canvas_ids_used:
        canvas_ids_used.append(canvas_id)
    if display:
        ipython_display(html_obj)
    return html_obj


def __cosmos_html(cosmo_id='cosmos'):
    return f'''
        <div id="{cosmo_id}"></div>

        <script>
            AddCanvasToDivById("{cosmo_id}")
        </script>
    '''


class IpythonObjects:
    def __init__(self, *objs):
        self.objs = objs

    def display(self):
        for obj in self.objs:
            return ipython_display(obj)

    # def __repr__(self):
    #     return self.display()


def cosmo_alt(links, nodes=None, canvas_id=None, *, display=True):
    data = _ensure_cosmo_data(links, nodes)

    if canvas_id is None:
        canvas_id = get_new_canvas_id()

    pre_script = init_cosmos(canvas_id=canvas_id)
    html_str = __cosmos_html(canvas_id)
    post_script = set_data(data, canvas_id)

    ipython_display(Javascript(pre_script))

    obj_to_return = IpythonObjects(HTML(html_str), Javascript(post_script))
    obj_to_return.canvas_id = canvas_id

    # fit_view(canvas_id)  # doesn't work
    if canvas_id not in canvas_ids_used:
        canvas_ids_used.append(canvas_id)

    if display:
        obj_to_return.display()
    return obj_to_return


# def cosmo_old(links, nodes=None, canvas_id=None):
#     data = _ensure_cosmo_data(links, nodes)
#     data = {'links': links, 'nodes': nodes}
#
#     if canvas_id is None:
#         canvas_id = get_new_canvas_id()
#
#     init_cosmos(canvas_id=canvas_id)
#     cosmos_html(canvas_id)
#     set_data(data, canvas_id)
#     fit_view(canvas_id)  # doesn't work
#     if canvas_id not in canvas_ids_used:
#         canvas_ids_used.append(canvas_id)
#     return canvas_id
