"""Test that reading the parameter SSOT does not require the notebook stack."""

import ast
from pathlib import Path

import pytest

import cosmograph.util as util

UTIL_SOURCE = Path(util.__file__).read_text()


def _module_level_imports(source):
    """Every module named by an import at the top level of `source`."""
    tree = ast.parse(source)
    names = set()
    for node in tree.body:  # top level only -- imports inside functions are fine
        if isinstance(node, ast.Import):
            names.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module.split(".")[0])
    return names


def test_ipython_is_not_imported_at_module_level():
    # util.py holds the SSOT machinery. An IPython import here is one of the two
    # routes that drag the notebook stack in; anywidget, via the package
    # __init__, is the other.
    assert "IPython" not in _module_level_imports(UTIL_SOURCE)


def test_the_check_would_notice_a_module_level_import():
    assert "IPython" in _module_level_imports("from IPython.display import HTML\n")
    assert "IPython" not in _module_level_imports(
        "def f():\n    from IPython.display import HTML\n"
    )


@pytest.mark.parametrize("name", ["display_output", "to_html_obj", "to_js_obj"])
def test_the_display_helpers_still_resolve(name):
    assert callable(getattr(util, name))


def test_the_display_helpers_are_still_discoverable():
    assert {"display_output", "to_html_obj", "to_js_obj"} <= set(dir(util))


def test_an_unknown_attribute_still_raises():
    with pytest.raises(AttributeError, match="no attribute 'not_a_thing'"):
        util.not_a_thing


def test_the_ssot_signature_still_builds():
    assert len(util.cosmograph_base_signature().names) > 100
