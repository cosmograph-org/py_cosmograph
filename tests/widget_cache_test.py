"""Test where the Arrow conversion cache lives -- it must not be the install dir."""

import os
from pathlib import Path

import pytest

from cosmograph.widget import utils
from cosmograph.widget.utils import CACHE_DIR_ENVVAR, cache_dir, mk_memory


def test_the_cache_is_not_inside_the_installed_package():
    # site-packages is often read-only, and a cache does not belong next to code.
    package_dir = Path(utils.__file__).parent
    assert package_dir not in cache_dir().parents
    assert cache_dir() != package_dir


def test_the_environment_variable_wins(monkeypatch, tmp_path):
    monkeypatch.setenv(CACHE_DIR_ENVVAR, str(tmp_path / "somewhere"))
    assert cache_dir() == tmp_path / "somewhere"


def test_a_tilde_in_the_environment_variable_is_expanded(monkeypatch):
    monkeypatch.setenv(CACHE_DIR_ENVVAR, "~/cosmo-cache")
    assert cache_dir() == Path.home() / "cosmo-cache"


def test_xdg_cache_home_is_honoured(monkeypatch, tmp_path):
    monkeypatch.delenv(CACHE_DIR_ENVVAR, raising=False)
    monkeypatch.setenv("XDG_CACHE_HOME", str(tmp_path))
    assert cache_dir() == tmp_path / "cosmograph"


def test_it_falls_back_to_the_home_cache(monkeypatch):
    monkeypatch.delenv(CACHE_DIR_ENVVAR, raising=False)
    monkeypatch.delenv("XDG_CACHE_HOME", raising=False)
    assert cache_dir() == Path.home() / ".cache" / "cosmograph"


@pytest.mark.skipif(
    os.name != "posix" or os.geteuid() == 0,
    reason="needs POSIX permissions, and root can write anywhere",
)
def test_an_unwritable_directory_disables_caching_instead_of_failing(tmp_path):
    read_only = tmp_path / "read-only"
    read_only.mkdir()
    read_only.chmod(0o500)
    try:
        memory = mk_memory(read_only / "cache")
        assert memory.location is None
    finally:
        read_only.chmod(0o700)


def test_conversion_still_works_through_the_cache(tmp_path):
    import pandas as pd

    memory = mk_memory(tmp_path / "cache")
    convert = memory.cache(lambda df: len(df))
    assert convert(pd.DataFrame({"id": ["a", "b"]})) == 2
