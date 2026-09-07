"""Test that params_ssot.json is in sync with the TypeScript sources it comes from."""


def test_params_ssot_matches_typescript_sources():
    """params_ssot.json should equal what a refresh from the TypeScript SSOT produces.

    When this fails, the vendored TypeScript snapshot moved ahead of the committed
    file: run `python -m cosmograph._dev_utils.params_ssot` and commit the result.
    """
    import json

    from cosmograph._dev_utils.params_ssot import PARAMS_SSOT_PATH, make_params_ssot

    with open(PARAMS_SSOT_PATH, encoding="utf-8") as file:
        committed = json.load(file)

    assert make_params_ssot() == committed


def test_params_ssot_doctests():
    import doctest

    from cosmograph._dev_utils import params_ssot

    assert doctest.testmod(params_ssot, raise_on_error=True).failed == 0
