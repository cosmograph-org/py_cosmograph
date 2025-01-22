"""Base functionality of cosmograph"""

from typing import Dict, Any, Union, Callable
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


# @inject_docstring_content(cosmo_base_params_doc_str, position=-1)
# @cosmo_base_sig.inject_into_keyword_variadic
@inject_docstring_content(cosmo_base_params_doc_str, position=-1)
def cosmo(
    data=None,
    *,
    disable_simulation: bool = None,  # False,
    simulation_decay: float = None,  # 1000,
    simulation_gravity: float = None,  # 0,
    simulation_center: float = None,  # 0,
    simulation_repulsion: float = None,  # 0.1,
    simulation_repulsion_theta: float = None,  # 1.7,
    simulation_repulsion_quadtree_levels: float = None,  # 12,
    simulation_link_spring: float = None,  # 1,
    simulation_link_distance: float = None,  # 2,
    simulation_link_dist_random_variation_range: list[Any] = None,  # [1, 1.2],
    simulation_repulsion_from_mouse: float = None,  # 2,
    simulation_friction: float = None,  # 0.85,
    simulation_cluster: float = None,
    background_color: Union[str, list[float]] = None,  #'#222222',
    space_size: int = None,  # 4096,
    point_color: Union[str, list[float]] = None,  #'#b3b3b3',
    point_greyout_opacity: float = None,  # 0.1,
    point_size: float = None,  # 4,
    point_size_scale: float = None,  # 1,
    hovered_point_cursor: str = None,
    render_hovered_point_ring: bool = None,  # False,
    hovered_point_ring_color: Union[str, list[float]] = None,  #'white',
    focused_point_ring_color: Union[str, list[float]] = None,
    focused_point_index: int = None,
    render_links: bool = None,  # True,
    link_color: Union[str, list[float]] = None,  #'#666666',
    link_greyout_opacity: float = None,  # 0.1,
    link_width: float = None,  # 1,
    link_width_scale: float = None,  # 1,
    curved_links: bool = None,  # False,
    curved_link_segments: int = None,  # 19,
    curved_link_weight: float = None,  # 0.8,
    curved_link_control_point_distance: float = None,  # 0.5,
    link_arrows: bool = None,
    link_arrows_size_scale: float = None,  # 1,
    link_visibility_distance_range: list[float] = None,  # [50, 150],
    link_visibility_min_transparency: float = None,  # 0.25,
    use_quadtree: bool = None,  # False,
    show_FPS_monitor: bool = None,  # False,
    pixel_ratio: float = None,  # 2,
    scale_points_on_zoom: bool = None,  # None, #True,
    initial_zoom_level: float = None,  # None, #3,
    disable_zoom: bool = None,  # None, #False,
    enable_drag: bool = None,
    fit_view_on_init: bool = None,  # True,
    fit_view_delay: float = None,  # 250,
    fit_view_padding: float = None,
    fit_view_duration: float = None,
    fit_view_by_points_in_rect: list[list[float]] = None,
    random_seed: Union[int, str] = None,
    point_sampling_distance: int = None,  # 150,
    point_id_by: str = None,
    point_index_by: str = None,
    point_color_by: str = None,
    point_size_by: str = None,
    point_size_range: list[float] = None,
    point_label_by: str = None,
    point_label_weight_by: str = None,
    point_x_by: str = None,
    point_y_by: str = None,
    point_cluster_by: str = None,
    point_cluster_strength_by: str = None,
    point_include_columns: list[str] = None,
    link_source_by: str = None,
    link_source_index_by: str = None,
    link_target_by: str = None,
    link_target_index_by: str = None,
    link_color_by: str = None,
    link_width_by: str = None,
    link_arrow_by: str = None,
    link_strength_by: str = None,
    link_strength_range: list[float] = None,
    link_include_columns: list[str] = None,
    show_labels: bool = None,
    show_dynamic_labels: bool = None,
    show_labels_for: list[str] = None,
    show_top_labels: bool = None,
    show_top_labels_limit: int = None,
    show_top_labels_by: str = None,
    static_label_weight: float = None,
    dynamic_label_weight: float = None,
    label_margin: float = None,
    show_hovered_point_label: bool = None,
    disable_point_size_legend: bool = None,
    disable_link_width_legend: bool = None,
    disable_point_color_legend: bool = None,
    disable_link_color_legend: bool = None,
    points: object = None,
    links: object = None,
    clicked_point_index: int = None,
    clicked_point_id: str = None,
    selected_point_indices: list[int] = None,
    selected_point_ids: list[str] = None,
    changePoints: Callable[[Dict[str, Any]], Any] = None,
    changeLinks: Callable[[Dict[str, Any]], Any] = None,
):
    """
    Thin layer over CosmographWidget to provide a base interface to the widget object,
    with signature, docs with argument descriptions, and a more flexible interface
    comprising some data processing, argument aliasing and validation, error handling,
    etc.

    """
    kwargs = process_cosmo_input(locals())
    if "points" not in kwargs and "links" not in kwargs:
        # If no data is given, just return a partial function with the kwargs filled in
        return partial(cosmo, **kwargs)
    return Cosmograph(**kwargs)


def process_cosmo_input(kwargs):
    data = kwargs.pop("data", None)
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
                error_msg += "\n".join(
                    f"You said `{kw}`: Did you mean `{argument_aliases[kw]}`?"
                    for kw in invalid_kws_that_are_aliases
                )

            if invalid_kws_that_are_not_aliases := invalid_keywords - set(
                argument_aliases
            ):
                t = ", ".join(invalid_kws_that_are_not_aliases)
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
        points, links = self.get(["points", "links"], default=None)

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
    "nodes": "points",
    "edges": "links",
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


html_code_data_def_template = """
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
"""


# TODO: Function should be moved to a better place
def mk_html_code(data):
    data = ensure_json_string(data)
    return html_code_data_def_template.format(json_data_str=data)
