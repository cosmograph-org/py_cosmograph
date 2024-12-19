"""Base functionality of cosmograph"""

from functools import cached_property, partial
from i2.doc_mint import inject_docstring_content
from cosmograph_widget import Cosmograph

from cosmograph.util import (
    snake_to_camel_case,
    cosmograph_base_docs,
    cosmograph_base_signature,
)

cosmo_base_sig = cosmograph_base_signature()
cosmo_base_params_doc_str = cosmograph_base_docs()


@inject_docstring_content(cosmo_base_params_doc_str, position=-1)
@cosmo_base_sig
def base_cosmo(**kwargs):
    """
    Thin layer over CosmographWidget to provide a base interface to the widget object.

    All this layer does is pass on the arguments to the CosmographWidget object.
    The only difference between this and the cosmograph object is that this one has
    an actual signature, with argument names, defaults, and type annotations.
    """
    return Cosmograph(**kwargs)


@inject_docstring_content(cosmo_base_params_doc_str, position=-1)
@cosmo_base_sig.inject_into_keyword_variadic
def cosmo(data=None, **kwargs):
    """
    Thin layer over CosmographWidget to provide a base interface to the widget object,
    with signature, docs with argument descriptions, and a more flexible interface
    comprising some data processing, argument aliasing and validation, error handling,
    etc.

    """
    kwargs = process_cosmo_input(data, kwargs)
    if 'points' not in kwargs and 'links' not in kwargs:
        # If no data is given, just return a partial function with the kwargs filled in
        return partial(cosmo, **kwargs)
    return Cosmograph(**kwargs)


def process_cosmo_input(data, kwargs):
    return CosmoArguments(data, kwargs).prepare_kwargs()


def remove_none_values(d):
    return {k: v for k, v in d.items() if v is not None}


class CosmoArguments:
    """
    Container for cosmograph arguments, along with diagnosis and processing methods
    """

    def __init__(self, data=None, kwargs=()):
        self.data = data
        # TODO: Should any Nones actually be passed on?
        self.kwargs = dict(kwargs)

    def prepare_kwargs(self):
        self.validate_kwargs()
        points, links = self.points_and_links()
        kwargs = remove_none_values(dict(self.kwargs, points=points, links=links))
        return kwargs

    def validate_kwargs(self):
        valid_names = set(cosmo_base_sig.names)
        invalid_keywords = self.kwargs.keys() - valid_names

        # check that all keys of kwargs are in valid_names
        if invalid_keywords:
            error_msg = "I didn't recognize some of your arguments:\n"

            if invalid_kws_that_are_aliases := invalid_keywords & set(argument_aliases):
                # make a message for the aliases, mentioning the keyword they are aliases for
                # and should be replaced by
                error_msg += '\n'.join(
                    f"You said `{kw}`: Did you mean `{argument_aliases[kw]}`?"
                    for kw in invalid_kws_that_are_aliases
                )

            if invalid_kws_that_are_not_aliases := invalid_keywords - set(
                argument_aliases
            ):
                t = ', '.join(invalid_kws_that_are_not_aliases)
                error_msg += f"And these I have no idea about: {t}"

            raise ValueError(error_msg)

    def points_and_links(self):
        """
        Get the points and links from the arguments, and raise an error if both are
        specified and `data` is also specified.

        The rules:
        - If `data` is not given (i.e. `None`), then `points` and `links` are returned as is.
        - If `data` is given, then:
            - If `points` is not given, then `points` is taken to be `data`.
            - If `links` is not given, then `links` is taken to be `data`.
            - If both `points` and `links` are given, raise an error.
        """
        data = self.data
        points, links = self.get(['points', 'links'], default=None)

        if data is not None:
            if points is None:
                # If points is None, take data to be points (whether links is None or not)
                points = data
            elif links is None:  # and points is not None
                # If points are given, but links is None, use data as links
                links = data
            else:
                # If both points and links are given, raise an error
                raise ValueError(
                    "Cannot specify `points` and `links` if you've specified `data`"
                )

        return points, links

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


# Make aliases for the arguments
argument_aliases = {
    'nodes': 'points',
    'edges': 'links',
}
# camel case aliases
argument_aliases = dict(
    argument_aliases, **{snake_to_camel_case(k): k for k in cosmo_base_sig.names}
)
argument_aliases = dict(
    argument_aliases,
    **{
        snake_to_camel_case(k, first_char_trans=str.upper): k
        for k in cosmo_base_sig.names
    },
)

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
