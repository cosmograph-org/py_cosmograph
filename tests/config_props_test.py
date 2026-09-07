"""Test that js/config-props.json still agrees with the Python side.

That file is the snake_case to camelCase map the widget uses to hand Python's
parameters to Cosmograph. It is maintained by hand, and a wrong or stale entry
is invisible: the parameter simply never reaches the graph.
"""

import json
from pathlib import Path

import pytest

from cosmograph.util import PARAMS_SSOT_PATH, snake_to_camel_case

CONFIG_PROPS_PATH = Path(__file__).parent.parent / "js" / "config-props.json"

# The one name that does not follow the plain snake-to-camel rule, because of
# how the acronym is spelled on the Cosmograph side.
IRREGULAR = {"show_fps_monitor": "showFPSMonitor"}


def _config_props():
    if not CONFIG_PROPS_PATH.is_file():
        pytest.skip("js/config-props.json is not in this install")
    return json.loads(CONFIG_PROPS_PATH.read_text())


def _ssot_names():
    return {param["name"] for param in json.loads(PARAMS_SSOT_PATH.read_text())}


def test_every_entry_names_a_real_parameter():
    # An entry for a parameter that no longer exists is dead weight, and usually
    # means a rename landed on one side only.
    unknown = sorted(set(_config_props()) - _ssot_names())
    assert not unknown, f"config-props.json names parameters that are not in the SSOT: {unknown}"


def test_the_camel_case_side_follows_the_rule():
    wrong = {
        snake: camel
        for snake, camel in _config_props().items()
        if camel != IRREGULAR.get(snake, snake_to_camel_case(snake))
    }
    assert not wrong, (
        f"config-props.json disagrees with snake_to_camel_case for {sorted(wrong)}. "
        f"If the spelling is deliberate, add it to IRREGULAR in this test."
    )


def test_the_irregular_entries_are_still_irregular():
    # If Cosmograph ever regularises one of these, this test says so rather than
    # leaving a stale exception behind.
    props = _config_props()
    for snake, camel in IRREGULAR.items():
        assert props.get(snake) == camel
        assert snake_to_camel_case(snake) != camel
