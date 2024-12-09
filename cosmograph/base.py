"""Base functionality of cosmograph"""

from i2.doc_mint import inject_docstring_content
from cosmograph_widget import Cosmograph

from cosmograph._resources import configs_dacc

cosmo_base_sig = configs_dacc.cosmograph_base_signature()
cosmo_base_params_doc_str = configs_dacc.cosmograph_base_docs()


@inject_docstring_content(cosmo_base_params_doc_str, position=-1)
@cosmo_base_sig
def base_cosmo(**kwargs):
    """
    Thin layer over CosmographWidget to provide a base interface to the widget object
    """
    return Cosmograph(**kwargs)


@inject_docstring_content(cosmo_base_params_doc_str, position=-1)
@cosmo_base_sig
def cosmo(data=None, **kwargs):
    """
    Thin layer over CosmographWidget to provide a base interface to the widget object
    """
    return Cosmograph(**kwargs)


def process_cosmo_input(data, **kwargs):
    kw = CosmoArguments(data=data, **kwargs)
    if data is not None and kw.non_nones({'points', 'links'}):
        raise ValueError(
            "Cannot specify `points` and `links` if you've specified `data`"
        )
    return data


class CosmoArguments:
    """
    Container for cosmograph arguments, along with diagnosis and processing methods
    """
    def __init__(self, data=None, **kwargs):
        self.data = data
        self.kwargs = kwargs

    def points_and_links(self):
        points, links = self.kwargs['points'], self.kwargs['links']

        if data is not None:
            if self.all_are_none({'points', 'links'}):
                points = data  # default is to use data as points (and links=None)
                return points, None 
            elif self.none_are_none({'points', 'links'}): 
                raise ValueError(
                    "Cannot specify `points` and `links` if you've specified `data`"
                )
            elif 'links' in self.non_none_names:
                points = data
                return points, self.kwargs['links']
            elif 'points' in self.non_none_names:
                links = data
                return self.kwargs['points'], links
        else:
            return self.kwargs.get('points'), self.kwargs.get('links')
    
    
    def points_and_links(self):
        points, links = self.get(['points', 'links'], default=None)

        if data is not None:
            if points is None and links is None:
                # If neither points or links are given, use data as points
                points = data  
                return points, None 
            elif points is None and links is not None:
                # If only links are given, use data as points
                points = data
                return points, self.get('links')
            elif points is not None and links is None:
                # If only points are given, use data as links
                links = data
                return self.get('points'), links
            else:
                # If both points and links are given, raise an error
                raise ValueError(
                    "Cannot specify `points` and `links` if you've specified `data`"
                )
        else:
            return self.get('points'), self.get('links')
    

    @cached_property
    def non_none_names(self):
        return {k for k, v in self.kwargs.items() if v is not None}
    
    def get(self, name, default=None):
        if isinstance(name, (list, tuple)):
            return [self.kwargs.get(k, default) for k in name]
        return self.kwargs.get(name, default)

    def non_nones(self, names):
        return self.non_nones_names & set(names)
    
    def all_are_none(self, names):
        return self.non_nones(names) == set()
    
    def none_are_none(self, names):
        return len(self.non_nones(names)) == len(names)
    



# --------------------------------------------------------------------------------------
# Some old code that might be useful

from typing import List, Optional, Tuple
from pydantic import BaseModel

NodeId = str  # TODO: Also include ints? Oblige ids to be valid python identifiers?


class Node(BaseModel):
    id: NodeId


class Link(BaseModel):
    source: NodeId
    target: NodeId


# TODO: Find a way to make these have a .validate (with pydantic)
Nodes = List[Node]
Links = List[Link]


class GraphJson(BaseModel):
    links: Links
    nodes: Nodes = []


from cosmograph.validation import ensure_json_string


html_code_data_def_template = '''
<div>
    <canvas></canvas>
</div>

<script>
    const data = {json_data_str}
    const canvas = document.querySelector("canvas");
    const graph = new cosmos.Graph(canvas);
    graph.setData(data.nodes, data.links);
    graph.fitView();
</script>
'''


# TODO: Function should be moved to a better place
def mk_html_code(data):
    data = ensure_json_string(data)
    return html_code_data_def_template.format(json_data_str=data)
