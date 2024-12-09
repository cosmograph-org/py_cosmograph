"""Old util stuff"""


# --------------------------------------------------------------------------------------
# And more old stuff
from cosmograph.util import data_files

cosmos_config = json.loads(data_files['cosmos_config.json'])['config']

_cosmos_config_info = cosmos_config
_default_of_py_name = {d["py_name"]: d["Default"] for d in _cosmos_config_info}
_prop_of_py_name = {d["py_name"]: d["Property"] for d in _cosmos_config_info}
# _py_name_of_prop = {d["Property"]: d["py_name"] for d in _cosmos_config_info}
_description_of_py_name = {d["py_name"]: d["Description"] for d in _cosmos_config_info}



# def set_data(data, canvas_id=DFLT_CANVAS):
#     from cosmograph.validation import validate_data

#     # TODO: Make the next three lines similar to the ensure_json_string method 😇
#     validate_data(data)
#     nodes = json.dumps(data["nodes"])
#     links = json.dumps(data["links"])

#     return f'if (SetData) SetData("{canvas_id}", {nodes}, {links})'


# def alt_set_data(links, nodes=None, canvas_id=DFLT_CANVAS):
#     links, nodes = _ensure_links_and_nodes(links, nodes)
#     return js.cosmos__set_data(canvas_id, links, nodes)


# def fit_view(canvas_id=DFLT_CANVAS):
#     return f'if (FitView) FitView("{canvas_id}")'



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
        "link_width='1', link_width_scale='1', link_arrows=true, "
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




# ------------------------------------------------------------------------------
# Putting a signature on cosmo


def convert_js_to_py_val(x):
    if isinstance(x, str):
        if x == 'undefined':
            return None
        if x == 'true':
            return True
        elif x == 'false':
            return False
        # TODO: Add list handling ('link_visibility_distance_range': '[50, 150]',)
        # elif x.startswith('[') and x.endswith(']'):
    try:
        return int(x)
    except Exception:
        try:
            return float(x)
        except Exception:
            return x


@lru_cache
def cosmos_config_info():
    # TODO: Do we really want to source our config info from the wiki?
    #   Maybe we should just have a separate file for it?
    #   But then the wiki should source itself from there, or else we'll have
    #   to keep them in sync manually.
    #   --> Better have one source of truth.
    from tabled.html import get_tables_from_url  # pip install tabled

    tables = get_tables_from_url(
        "https://github.com/cosmograph-org/cosmos/wiki/Cosmos-configuration"
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


def _download_and_save_config_info():
    import json

    config_info = cosmos_config_info()
    data_files['config_info.json'] = json.dumps(config_info).encode()


# # TODO: Take out of try/catch once we have a stable source of config info
try:
    import json

    config_info = json.loads(data_files['config_info.json'])
    _config_dflts = [
        {
            'name': d['py_name'],
            'kind': Sig.KEYWORD_ONLY,
            'default': convert_js_to_py_val(d['Default']),
        }
        for d in config_info
    ]

    _original_cosmo_sig = Sig(cosmo)
    _cosmo_sig = _original_cosmo_sig - 'display'
    _cosmo_sig = _cosmo_sig - 'config'
    _cosmo_sig = _cosmo_sig + Sig.from_params(
        [{'name': 'display', 'default': True, 'kind': Sig.KEYWORD_ONLY}]
    )
    _cosmo_sig = _cosmo_sig + Sig.from_params(_config_dflts)
    _ko_names_kinds = {k: Sig.KEYWORD_ONLY for k in _cosmo_sig.names[3:]}
    _cosmo_sig = _cosmo_sig.ch_kinds(_allow_reordering=False, **_ko_names_kinds)
    # cosmo = _cosmo_sig(cosmo)  # TODO: See why this doesn't work
    cosmo.__signature__ = _cosmo_sig
except Exception as e:
    print(f"There was a problem making a nice signature for cosmo: {e}")
