"""Test base.py"""


def test_cosmo_import():
    """Just test that we can import cosmo (which triggers many object constructions)"""
    from cosmograph import cosmo

    assert cosmo
