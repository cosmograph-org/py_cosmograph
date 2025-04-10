"""
Python binders to cosmograph functionality


>>> import pandas as pd
>>> from cosmograph import cosmo
>>>
>>> single_link = {
...     'points': [{'id': '0'}, {'id': '1'}],
...     'links': [{'source': '0', 'target': '1'}],
... }
>>> points, links = map(pd.DataFrame, single_link.values())
>>> g = cosmo(
...     points=points,
...     links=links,
...     point_id_by='id',
...     link_source_by='source',
...     link_target_by='target',
...     simulation_gravity=0,
...     simulation_center=1,
... )


"""

from cosmograph.base import cosmo, base_cosmo
from cosmograph.widget import Cosmograph
from cosmograph.config import set_api_key, get_api_key

from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("cosmograph")  # fetch version from package metadata
except PackageNotFoundError:
    __version__ = None
