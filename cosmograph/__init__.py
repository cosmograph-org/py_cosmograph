"""Python binders to cosmograph functionality"""

from cosmograph.base import cosmo, base_cosmo
from cosmograph_widget import Cosmograph

from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("cosmograph")  # fetch version from package metadata
except PackageNotFoundError:
    __version__ = None
