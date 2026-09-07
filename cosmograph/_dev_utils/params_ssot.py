"""Refresh ``cosmograph/data/params_ssot.json`` from the TypeScript sources.

The parameters a user passes to ``cosmo`` are defined in three places at once: the
widget's traitlets own the Python names and annotations, while the types, prose
descriptions and default values belong to the TypeScript library. This module keeps
the Python-side copy of the second half honest, so nobody has to hand-copy a default
out of a ``.ts`` file again.

It reads a params SSOT produced by the TypeScript build
(``pnpm run ai:params-ssot`` in the cosmograph repo, which ships the result as
``ai/params-ssot.json`` inside ``@cosmograph/cosmograph``), matches each entry to a
widget traitlet by name, and writes the merged result back to
``cosmograph/data/params_ssot.json``.

Usage::

    python -m cosmograph._dev_utils.params_ssot --check   # fail if the file is stale
    python -m cosmograph._dev_utils.params_ssot           # rewrite it

The snapshot it reads lives in ``_dev_utils/data/params_ssot_from_ts.json``. Point
``--source`` at a newer build (a path, or a url such as the file inside a published
``@cosmograph/cosmograph``) to update that snapshot as well, so the check below keeps
working offline.

What the refresh does and does not touch, deliberately:

* ``description`` and ``default`` are taken from the TypeScript entry, which owns them.
  A default is only overwritten when TypeScript actually declares one, so a parameter
  whose default the library decides at runtime keeps whatever it has here rather than
  being silently unset, and never for a parameter listed in ``UNSYNCED_DEFAULTS``.
* ``annotation`` is left alone. Python owns it, since it describes what the widget
  accepts, not what the TypeScript config declares.
* Parameters with no TypeScript counterpart (widget-only ones such as ``api_key`` or
  ``clicked_point_index``) are left untouched.
* The set of parameters is not changed, and their order is kept, so the diff of a
  refresh reads as the upstream change and nothing else. Widget traitlets missing
  from the file are reported rather than added: a new parameter is a deliberate
  addition to ``cosmo``'s signature, not something a refresh should decide.
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, Iterable, List, Mapping, Optional

DFLT_TS_SOURCE = os.path.join(
    os.path.dirname(__file__), "data", "params_ssot_from_ts.json"
)
PARAMS_SSOT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "params_ssot.json",
)

Param = Dict[str, Any]

# Parameters whose default TypeScript disagrees with, and which we have not moved yet.
# These are places where `cosmo` sends an old cosmos engine value rather than the one the
# library now uses, so adopting them changes how graphs render. That is a change worth
# making on its own, not a side effect of a refresh, so the refresh leaves them alone and
# the sync test stays green. Empty this set (and rerun the refresh) to adopt them.
UNSYNCED_DEFAULTS = frozenset(
    {
        "background_color",
        "hovered_link_width_increase",
        "link_color_palette",
        "link_default_color",
        "link_strength_range",
        "link_width_range",
        "point_color_palette",
        "point_default_color",
        "point_greyout_opacity",
        "point_sampling_distance",
        "point_size_range",
        "preserve_point_positions_on_data_update",
        "reset_selection_on_empty_canvas_click",
        "show_dynamic_labels",
        "show_hovered_point_label",
        "show_labels",
        "show_top_labels",
        "show_top_labels_limit",
        "simulation_friction",
        "simulation_link_distance",
        "simulation_link_spring",
        "simulation_repulsion",
        "unknown_color",
        "use_point_color_strategy_for_cluster_labels",
    }
)


def _camel_case(snake_name: str) -> str:
    head, *tail = snake_name.split("_")
    return head + "".join(word[:1].upper() + word[1:] for word in tail)


def _read_json(source: str) -> Any:
    """Reads a json file, or a url pointing to one."""
    if source.startswith(("http://", "https://")):
        from urllib.request import urlopen

        with urlopen(source) as response:
            return json.loads(response.read().decode("utf-8"))
    with open(source, encoding="utf-8") as file:
        return json.load(file)


def ts_params(source: str = DFLT_TS_SOURCE) -> Dict[str, Param]:
    """The TypeScript params SSOT, keyed by its (camelCase) parameter name."""
    return {param["name"]: param for param in _read_json(source)["params"]}


def _widget_traits() -> Dict[str, Any]:
    from traitlets.traitlets import BaseDescriptor

    from cosmograph.widget import Cosmograph

    return {
        name: trait
        for name, trait in vars(Cosmograph).items()
        if isinstance(trait, BaseDescriptor)
    }


def _deprecated_names(names: Iterable[str]) -> set:
    """The names ``cosmo`` rewrites away before use, so they are not parameters of it.

    Asking the runtime beats keeping a second list of them here: whatever
    ``handle_deprecated_properties`` drops is by definition deprecated.
    """
    from cosmograph.base import handle_deprecated_properties

    given = {name: True for name in names}
    return set(given) - set(handle_deprecated_properties(dict(given)))


def widget_param_names() -> List[str]:
    """The widget traitlets that are actual ``cosmo`` parameters."""
    public = [name for name in _widget_traits() if not name.startswith("_")]
    deprecated = _deprecated_names(public)
    return [name for name in public if name not in deprecated]


def refresh_params(
    current: List[Param],
    from_ts: Mapping[str, Param],
    *,
    param_names: Optional[Iterable[str]] = None,
    name_map: Optional[Mapping[str, str]] = None,
    keep_defaults: Iterable[str] = (),
) -> List[Param]:
    """The params SSOT with descriptions and defaults refreshed from TypeScript.

    >>> current = [{'name': 'point_default_size', 'default': 4, 'annotation': 'float',
    ...             'description': 'old'}]
    >>> from_ts = {'pointDefaultSize': {'name': 'pointDefaultSize', 'default': 9,
    ...                                 'description': 'The default point size.'}}
    >>> refresh_params(current, from_ts)
    [{'name': 'point_default_size', 'default': 9, 'annotation': 'float', 'description': 'The default point size.'}]

    A parameter TypeScript does not declare a default for keeps the one it has:

    >>> from_ts = {'pointDefaultSize': {'name': 'pointDefaultSize', 'description': 'Size.'}}
    >>> refresh_params(current, from_ts)
    [{'name': 'point_default_size', 'default': 4, 'annotation': 'float', 'description': 'Size.'}]

    ``keep_defaults`` names parameters whose default should be left as it is, whatever
    TypeScript says, so that adopting it can be a change of its own:

    >>> from_ts = {'pointDefaultSize': {'name': 'pointDefaultSize', 'default': 9}}
    >>> refresh_params(current, from_ts, keep_defaults=['point_default_size'])
    [{'name': 'point_default_size', 'default': 4, 'annotation': 'float', 'description': 'old'}]

    Give ``param_names`` to also drop parameters the widget no longer has:

    >>> refresh_params(current, {}, param_names=[])
    []
    """
    name_map = name_map or {}
    keep = None if param_names is None else set(param_names)
    keep_defaults = set(keep_defaults)

    refreshed = []
    for param in current:
        if keep is not None and param["name"] not in keep:
            continue
        param = dict(param)
        ts_param = from_ts.get(
            name_map.get(param["name"]) or _camel_case(param["name"])
        )
        if ts_param is not None:
            if "description" in ts_param:
                param["description"] = ts_param["description"]
            if "default" in ts_param and param["name"] not in keep_defaults:
                param["default"] = ts_param["default"]
        refreshed.append(param)

    return refreshed


def _js_name_map() -> Dict[str, str]:
    """The hand-maintained snake_case to camelCase map the JS widget uses."""
    js_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "js"
    )
    path = os.path.join(js_dir, "config-props.json")
    return _read_json(path) if os.path.isfile(path) else {}


def make_params_ssot(source: str = DFLT_TS_SOURCE) -> List[Param]:
    """The params SSOT as it should be, given the current TypeScript snapshot."""
    with open(PARAMS_SSOT_PATH, encoding="utf-8") as file:
        current = json.load(file)
    return refresh_params(
        current,
        ts_params(source),
        param_names=widget_param_names(),
        name_map=_js_name_map(),
        keep_defaults=UNSYNCED_DEFAULTS,
    )


def _dumps(params: List[Param]) -> str:
    return json.dumps(params, indent=4) + "\n"


def save_ts_snapshot(source: str, to: str = DFLT_TS_SOURCE) -> None:
    """Vendors the TypeScript params SSOT, so the sync check needs no network."""
    with open(to, "w", encoding="utf-8") as file:
        file.write(json.dumps(_read_json(source), indent=2) + "\n")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--source",
        default=DFLT_TS_SOURCE,
        help="path or url of the TypeScript params SSOT (default: the vendored snapshot)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="only report whether params_ssot.json is up to date",
    )
    args = parser.parse_args(argv)

    if args.source != DFLT_TS_SOURCE and not args.check:
        save_ts_snapshot(args.source)
        print(f"Updated the TypeScript snapshot from {args.source}")
        args.source = DFLT_TS_SOURCE

    params = make_params_ssot(args.source)
    with open(PARAMS_SSOT_PATH, encoding="utf-8") as file:
        committed = file.read()

    missing = [n for n in widget_param_names() if n not in {p["name"] for p in params}]
    if missing:
        print(f"Widget traitlets absent from params_ssot.json: {', '.join(missing)}")

    if _dumps(params) == committed:
        print(f"params_ssot.json is up to date ({len(params)} params)")
        return 0

    if args.check:
        print(
            "params_ssot.json is out of date - run "
            "`python -m cosmograph._dev_utils.params_ssot` and commit the result",
            file=sys.stderr,
        )
        return 1

    with open(PARAMS_SSOT_PATH, "w", encoding="utf-8") as file:
        file.write(_dumps(params))
    print(f"Wrote params_ssot.json ({len(params)} params)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
