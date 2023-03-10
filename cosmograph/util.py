"""
Utils to prepare data for cosmos
"""

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

files = _files("cosmograph")
data_dir = files / "data"
data_dir_path = str(data_dir)
js_dir = files / "js"
js_dir_path = str(js_dir)


def _postprocess(func, egress):
    return Pipe(func, egress)


postprocess = lambda egress: partial(_postprocess, egress=egress)
display_output = postprocess(ipython_display)
to_html_obj = postprocess(HTML)
to_js_obj = postprocess(Javascript)


@add_ipython_key_completions
@wrap_kvs(key_of_id=lambda x: x[: -len(".js")], id_of_key=lambda x: x + ".js")
@filt_iter(filt=lambda x: x.endswith(".js"))
class JsFiles(TextFiles):
    """A store of js files"""


_replace_non_alphanumerics_by_underscore = partial(re.compile(r"\W").sub, "_")


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
    return (js_dir / "cosmos-iife-bundle.js").read_text()
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
    return get_cosmos_iife_bundle()


def data_to_html_obj(data):
    # TODO: This function should be moved to a better place
    from cosmograph.base import mk_html_code

    display_get_cosmos_iife_bundle()
    html_code = mk_html_code(data)
    html_obj = HTML(html_code)
    fit_view()
    return html_obj


_js_mk_canvas_and_graphs_containers = js_files["mk_canvas_and_graphs_containers"]
_js_mk_new_canvas_and_cosmos_instance = js_files["mk_new_canvas_and_cosmos_instance"]
_js_mk_api_methods = js_files["mk_api_methods"]


_canvas_ids = (f"canvas_{id_:02.0f}" for id_ in count())
get_new_canvas_id = partial(next, _canvas_ids)

# def get_new_canvas_id():
#     """Gets a new canvas id"""
#     return next(_canvas_ids)

DFLT_CANVAS = get_new_canvas_id()


@lru_cache
def _one_time_setup():
    """Set the JS env up so that the rest of the functions will work.
    Note: Will run only once, even if called multiple times.
    """
    js_code = "\n\n".join(
        [
            get_cosmos_iife_bundle(),
            js_files["mk_canvas_and_graphs_containers"],
            js_files["mk_new_canvas_and_cosmos_instance"],
            js_files["mk_api_methods"],
            js_files["interface"],
        ]
    )
    return js_code


ipython_display(Javascript(_one_time_setup()))

from jy import add_js_funcs

js = add_js_funcs(js_files["interface"])


@lru_cache
def init_cosmos(canvas_id=DFLT_CANVAS, canvas_height="400px", canvas_width="100%"):
    return f"""
        globalThis.CreateCanvasAndCosmosById("{canvas_id}", "{canvas_height}", "{canvas_width}")
    """


def cosmos_html(cosmo_id="cosmos"):
    return f"""
        <div id="{cosmo_id}"></div>

        <script>
            AddCanvasToDivById("{cosmo_id}")
        </script>
    """


def set_data(data, canvas_id=DFLT_CANVAS):
    # TODO: Make the next three lines similar to the ensure_json_string method 😇
    validate_data(data)
    nodes = json.dumps(data["nodes"])
    links = json.dumps(data["links"])

    return f'if (SetData) SetData("{canvas_id}", {nodes}, {links})'


def alt_set_data(links, nodes=None, canvas_id=DFLT_CANVAS):
    links, nodes = _ensure_links_and_nodes(links, nodes)
    return js.cosmos__set_data(canvas_id, links, nodes)


def fit_view(canvas_id=DFLT_CANVAS):
    return f'if (FitView) FitView("{canvas_id}")'


def ordered_unique(iterable):
    seen = set()
    seen_add = seen.add
    return (x for x in iterable if not (x in seen or seen_add(x)))


def _nodes_from_links(links):
    def _yield_nodes_from_links(links):
        for link in links:
            yield link["source"]
            yield link["target"]

    return [{"id": x} for x in ordered_unique(_yield_nodes_from_links(links))]


from cosmograph.validation import is_links, is_graph_json, is_nodes


def _ensure_links_and_nodes(links, nodes=None):
    if nodes is None:
        if is_graph_json(links):
            return links
        elif is_links(links):
            nodes = _nodes_from_links(links)
    assert is_links(links), f"Not a valid links format"
    assert is_nodes(nodes), f"Not a valid nodes format"
    return links, nodes


def _ensure_cosmo_data(links, nodes=None):
    links, nodes = _ensure_links_and_nodes(links, nodes)
    return {"links": links, "nodes": nodes}


canvas_ids_used = []


def _cosmos_html(cosmo_id="cosmos", pre_script="", post_script=""):
    return f"""
        <div id="{cosmo_id}"></div>

        <script>
            {pre_script}
            AddCanvasToDivById("{cosmo_id}")
            {post_script}
        </script>
    """


def cosmo(links, nodes=None, canvas_id=None, *, display=False):
    if canvas_id is None:
        canvas_id = get_new_canvas_id()

    html_str = _cosmos_html(
        canvas_id,
        pre_script=init_cosmos(canvas_id=canvas_id),
        post_script=alt_set_data(links, nodes, canvas_id),
    )

    html_obj = HTML(html_str)
    html_obj.canvas_id = canvas_id

    # fit_view(canvas_id)  # doesn't work
    if canvas_id not in canvas_ids_used:
        canvas_ids_used.append(canvas_id)
    if display:
        ipython_display(html_obj)
    return html_obj


def __cosmos_html(cosmo_id="cosmos"):
    return f"""
        <div id="{cosmo_id}"></div>

        <script>
            AddCanvasToDivById("{cosmo_id}")
        </script>
    """


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


# ---------------------------------------------------------------------------------------

from functools import lru_cache
import re


def camel_to_snake_case(name):
    # Replace any non-word character with an underscore
    name = re.sub(r"\W+", "_", name)
    # Insert an underscore before any capital letter (except the first one)
    name = re.sub(r"([a-z])([A-Z])", r"\1_\2", name).lower()
    return name


def snake_to_camel_case(name, first_char_trans=str.lower):
    # Split the string into words separated by underscores
    words = name.split("_")
    # Convert each word to title case (i.e., with the first letter capitalized)
    words = [w.capitalize() for w in words]
    # Join the words together into a single string
    result = "".join(words)
    # process the first character (possibly)
    if first_char_trans and result:
        result = first_char_trans(result[0]) + result[1:]
    return result


def _assert_camel_and_snake_sanity(camel_cases, snake_cases):
    """
    Make sure that our camel to snake functions can actually fall back on their feet.
    (So we don't have to keep the mapping around)
    """
    # For now, they don't (need to discuss) so muting this function


#     agree_1 = [
#         x == y for x, y in zip(
#             map(camel_to_snake_case, camel_cases),
#             list(snake_cases)
#         )
#     ]
#     agree_2 = [
#         x == y for x, y in zip(
#             list(camel_cases),
#             map(snake_to_camel_case, snake_cases),
#         )
#     ]
#     agree = [x and y for x, y in zip(agree_1, agree_2)]
#     if not all(agree):
#         i = agree.index(False)
#         raise AssertionError(
#             f"{list(camel_cases)[i]} and {list(snake_cases)[i]} do not agree"
#         )


@lru_cache
def cosmos_config_info():
    # TODO: Do we really want to source our config info from the README?
    #   Maybe we should just have a separate file for it?
    #   But then the README should source itself from there, or else we'll have
    #   to keep them in sync manually.
    from tabled.html import get_tables_from_url  # pip install tabled

    tables = get_tables_from_url(
        "https://github.com/cosmograph-org/cosmos/blob/master/README.md"
    )
    is_cosmos_config_table = lambda table: "backgroundColor" in set(
        table.get("Property", [])
    )
    table = next(filter(is_cosmos_config_table, tables), None)
    if table is None:
        raise ValueError("Couldn't find a cosmos configuration table")

    table["py_name"] = list(map(camel_to_snake_case, table["Property"]))
    _assert_camel_and_snake_sanity(table["Property"], table["py_name"])
    return table.to_dict(orient="records")


_cosmos_config_info = cosmos_config_info()
_default_of_py_name = {d["py_name"]: d["Default"] for d in _cosmos_config_info}
_prop_of_py_name = {d["py_name"]: d["Property"] for d in _cosmos_config_info}
_description_of_py_name = {d["py_name"]: d["Description"] for d in _cosmos_config_info}


# The raw call is a two arg function
def _raw_cosmos_call(canvas, config):
    """
    This is the raw javascript call that we'll use to configure cosmos.
    """
    # TODO: Replace with the actual code
    return f"{canvas=}, {config=}"


# but the python interface should have more information: Explicitly showing the
# arguments, with their descriptions, defaults, etc.
# So we need to make the signature for that function.

from i2 import Sig, Param
from i2.signatures import empty


def mk_signature_for_cosmo():
    sig = Sig("canvas")
    for d in _cosmos_config_info:
        sig += Param(d["py_name"], default=d.get("Default", empty))
    return sig


_cosmo_call_sig = mk_signature_for_cosmo()


@_cosmo_call_sig
def _py_cosmos_call(canvas, **config):
    """
    Do a cosmo call.

    """
    if any(argname not in _prop_of_py_name for argname in config):
        raise TypeError(
            f"Invalid argument names: {config.keys() - _prop_of_py_name.keys()}"
        )
    config = {_prop_of_py_name[argname]: value for argname, value in config.items()}
    return _raw_cosmos_call(canvas, config)


def _mk_py_cosmos_arg_description():
    """Generates the docstring 'argument description' snippet for _py_cosmos_call"""
    def gen():
        yield "    :param canvas: Canvas element to render to"
        for py_name, description in _description_of_py_name.items():
            # TODO: Replace occurences of JS camel property name with python snake name
            yield f"    :param {py_name}: {description}"
    return "\n" + "\n".join(gen())


_py_cosmos_call.__doc__ += _mk_py_cosmos_arg_description()


def _tmp_test_of_py_costmos_call():
    from i2 import Sig

    assert str(Sig(_py_cosmos_call)) == (
        "(canvas, background_color='#222222', space_size='4096', node_color='#b3b3b3'"
        ", node_greyout_opacity='0.1', node_size='4', node_size_scale='1', "
        "render_highlighted_node_ring='true', highlighted_node_ring_color='undefined', "
        "render_links='true', link_color='#666666', link_greyout_opacity='0.1', "
        "link_width='1', link_width_scale='1', link_arrows='true', "
        "link_arrows_size_scale='1', link_visibility_distance_range='[50, 150]', "
        "link_visibility_min_transparency='0.25', use_quadtree='false', "
        "simulation='See Simulation configuration table for more details', "
        "events_on_click='undefined', events_on_mouse_move='undefined', "
        "events_on_node_mouse_over='undefined', events_on_node_mouse_out='undefined', "
        "events_on_zoom_start='undefined', events_on_zoom='undefined', "
        "events_on_zoom_end='undefined', show_fpsmonitor='false', pixel_ratio='2', "
        "scale_nodes_on_zoom='true', random_seed='undefined')"
    )
    assert _py_cosmos_call('CANVAS', node_color='blue') == (
        "canvas='CANVAS', config={'nodeColor': 'blue'}"
    )
    assert _py_cosmos_call('CANVAS', node_color='blue', node_size=5) == (
        "canvas='CANVAS', config={'nodeColor': 'blue', 'nodeSize': 5}"
    )

    import pytest
    with pytest.raises(TypeError) as excinfo:
        _py_cosmos_call('WTF', invalid_arg='whatevs')
        assert "Invalid argument names: {'invalid_arg'}" in str(excinfo.value)

    # TODO: Just need to get the right blank spaces
    # assert _py_cosmos_call.__doc__[:200] == """
    # Do a cosmo call.
    #
    #
    # :param canvas: Canvas element to render to
    # :param background_color: Canvas background color
    # :param space_size: Simulation space size (max 8192)
    # :param node_
    # """


