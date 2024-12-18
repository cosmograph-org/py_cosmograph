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
    Files,
    JsonFiles,
    wrap_kvs,
    filt_iter,
    invertible_maps,
    add_ipython_key_completions,
    Pipe,
)
from dol.sources import AttrContainer

import pandas as pd


# --------------------------------------------------------------------------------------
# Constants and data access

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

data_files = Files(data_dir_path)
json_files = filt_iter.suffixes('.json')(JsonFiles(data_dir_path))


color_names_set = set(json_files['color_names.json'])

# --------------------------------------------------------------------------------------
# Extracting the interface from the data

import typing
import re
from typing import Any, Callable
from i2 import Sig, Param, params_to_docstring

PARAMS_SSOT_PATH = data_dir / "params_ssot.json"


def _params_ssot(param_names=None):
    params_ssot = json.loads(PARAMS_SSOT_PATH.read_text())
    if param_names is not None:
        params_ssot = [d for d in params_ssot if d["name"] in param_names]
    return params_ssot


def cosmograph_base_signature(param_names=None):
    params_ssot = _params_ssot(param_names)
    for d in params_ssot:
        d.pop('description', None)  # delete description if any
        d.update(
            annotation=str_to_annotation(d["annotation"])
        )  # convert annotation to type
        d['kind'] = Sig.KEYWORD_ONLY

    return Sig([Param(**d) for d in params_ssot])


def cosmograph_base_docs(param_names=None, take_name_of_types=True):
    """Get the params information part of a docstring"""
    params_ssot = _params_ssot(param_names)
    return params_to_docstring(params_ssot)


def is_parameterized_type(obj):
    """
    Determines if an object is a parameterized type (e.g., list[int]) or not.

    Args:
        obj: The object to check.

    Returns:
        True if it's a parameterized type, False otherwise.
    """
    return typing.get_origin(obj) is not None


def annotation_to_str(annotation):
    """
    Encodes Python type annotations as strings for JSON serialization.

    This is part of a specialized Python-to-string codec designed to encode and decode
    Python type annotations in a way that allows them to be serialized and deserialized
    in JSON-compatible formats.

    Args:
        annotation: The type annotation to encode.

    Returns:
        A string representation of the annotation.

    Raises:
        ValueError: If the annotation type is unknown.

    Examples:
    >>> original = [
    ...     bool,
    ...     float,
    ...     list[Any],
    ...     typing.Union[str, list[float]],
    ...     int,
    ...     str,
    ...     list[float],
    ...     list[list[float]],
    ...     typing.Union[int, str],
    ...     list[str],
    ...     object,
    ...     list[int],
    ...     typing.Callable[[typing.Dict[str, Any]], Any]
    ... ]
    >>> encoded = list(map(annotation_to_str, original))
    >>> encoded
    ['bool', 'float', 'list[typing.Any]', 'typing.Union[str, list[float]]', 'int', 'str', \
'list[float]', 'list[list[float]]', 'typing.Union[int, str]', 'list[str]', 'object', 'list[int]', \
'typing.Callable[[typing.Dict[str, typing.Any]], typing.Any]']
    """
    if isinstance(annotation, str):
        return annotation
    elif is_parameterized_type(annotation):
        return str(annotation)
    elif isinstance(annotation, type):
        return annotation.__name__
    else:
        raise ValueError(f"Unknown annotation type: {annotation}")


def default_is_safe(string: str) -> bool:
    """
    Checks if a string is safe to evaluate as a type annotation.

    The string is considered safe if:
    - It contains only alphanumericals, spaces, dots, commas, and brackets.
    - It starts with one of a predefined list of allowed prefixes.

    Args:
        string: The string to check.

    Returns:
        True if the string is safe, False otherwise.
    """
    allowed_prefixes = ["bool", "float", "list", "typing", "int", "object", "str"]
    allowed_chars = re.compile(r"^[\w\s.,\[\]()]+$")

    return allowed_chars.match(string) is not None and any(
        string.strip().startswith(prefix) for prefix in allowed_prefixes
    )


def str_to_annotation(string, is_safe: Callable[[str], bool] = default_is_safe):
    """
    Decodes a string representation of a Python type annotation back into the annotation.

    Args:
        string: The string representation of the annotation.
        is_safe: A function that determines if the string is safe to evaluate.

    Returns:
        The decoded Python type annotation.

    Raises:
        ValueError: If the string is not safe to evaluate.
    """
    if not is_safe(string):
        raise ValueError(
            f"The string '{string}' is not considered safe for evaluation."
        )
    return eval(string)


# --------------------------------------------------------------------------------------
# General/Misc utils

from functools import lru_cache
import re


def move_to_front(df: pd.DataFrame, cols) -> pd.DataFrame:
    """
    Move the columns in `cols` to the front of the DataFrame
    """
    return df[cols + [col for col in df.columns if col not in cols]]


def ordered_unique(iterable):
    seen = set()
    seen_add = seen.add
    return (x for x in iterable if not (x in seen or seen_add(x)))


class IpythonObjects:
    def __init__(self, *objs):
        self.objs = objs

    def display(self):
        for obj in self.objs:
            return ipython_display(obj)

    # def __repr__(self):
    #     return self.display()


def add_attributes(obj, **attrs):
    for k, v in attrs.items():
        setattr(obj, k, v)
    return obj


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

# _cosmos_config_info = cosmos_config_info()


# --------------------------------------------------------------------------------------
# Old stuff (TODO: Deprecate and remove)


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


def _nodes_from_links(links):
    def _yield_nodes_from_links(links):
        for link in links:
            yield link["source"]
            yield link["target"]

    return [{"id": x} for x in ordered_unique(_yield_nodes_from_links(links))]


from cosmograph.validation import is_links, is_graph_json, is_nodes
