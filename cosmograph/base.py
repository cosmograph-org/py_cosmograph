"""Base functionality of cosmograph"""

from typing import Dict, Any, Union, Callable, Sequence
from functools import cached_property, partial
from i2.doc_mint import inject_docstring_content

from cosmograph.widget import Cosmograph

from cosmograph.util import (
    CosmoKwargs,
    snake_to_camel_case,
    cosmograph_base_docs,
    cosmograph_base_signature,
)

from cosmograph.config import get_api_key

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


def process_cosmo_input(kwargs: CosmoKwargs) -> CosmoKwargs:
    data = kwargs.pop("data", None)
    return CosmoArguments(data, kwargs).prepare_kwargs()


def copy_points_and_links(kwargs):
    if kwargs.get("points", None) is not None:
        kwargs["points"] = kwargs["points"].copy()
    if kwargs.get("links", None) is not None:
        kwargs["links"] = kwargs["links"].copy()
    return kwargs


def remove_none_values(d):
    return {k: v for k, v in d.items() if v is not None}


def first_element(seq):
    return next(iter(seq), None)


def prioritize_points(kwargs, data=None):
    """
    A data resolver: Will priorities assigning data to points.

    The rules:
    - If `data` is not given (i.e. `None`), then `points` and `links` are returned as is.
    - If `data` is given, then:
        - If `points` is not given, then `points` is taken to be `data`.
        - If `links` is not given, then `links` is taken to be `data`.
        - If both `points` and `links` are given, raise an error.
    """
    if data is not None:
        if kwargs.get("points", None) is None:
            # If points is None, take data to be points (whether links is None or not)
            kwargs["points"] = data
        elif kwargs.get("links", None) is None:  # and points is not None
            # If points are given, but links is None, use data as links
            kwargs["links"] = data
        else:
            # If both points and links are given, raise an error
            raise ValueError(
                "Cannot specify `points` and `links` if you've specified `data`"
            )
    return kwargs


def validate_kwargs(kwargs):
    valid_names = set(cosmo_base_sig.names)
    invalid_keywords = kwargs.keys() - valid_names

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

        if invalid_kws_that_are_not_aliases := invalid_keywords - set(argument_aliases):
            t = ", ".join(invalid_kws_that_are_not_aliases)
            error_msg += f"And these I have no idea about: {t}"

        raise ValueError(error_msg)

    return kwargs


CosmoKwargsTrans = Callable[[CosmoKwargs], CosmoKwargs]
Data = Any
dflt_ingress = (copy_points_and_links,)


def __extra_cosmo_params(
    data=None,
    *,
    ingress: Sequence[CosmoKwargsTrans] = (copy_points_and_links,),
    copy_before_ingress: bool = True,
    data_resolution: Callable[[CosmoKwargs, Data], CosmoKwargs] = prioritize_points,
    validate_kwargs: Callable[[CosmoKwargs], CosmoKwargs] = validate_kwargs,
):
    """Just to hold the signature of the extra cosmo params"""


# @inject_docstring_content(cosmo_base_params_doc_str, position=-1)
# @cosmo_base_sig.inject_into_keyword_variadic
@inject_docstring_content(cosmo_base_params_doc_str, position=-1)
def cosmo(
    data=None,
    *,
    ingress: Sequence[CosmoKwargsTrans] = (),
    # base cosmograph widget params ---------------------------------------------------
    points: object = None,
    links: object = None,
    point_x_by: str = None,
    point_y_by: str = None,
    point_size_by: str = None,
    point_color_by: str = None,
    point_color_palette: list[str] = None,
    point_color_by_map: Dict[str, Union[str, list[float]]] = None,
    point_color_strategy: str = None,
    point_label_by: str = None,
    point_color: Union[str, list[float]] = None,
    point_greyout_opacity: float = None,
    point_size: float = None,
    point_size_scale: float = None,
    point_sampling_distance: int = None,
    point_id_by: str = None,
    point_index_by: str = None,
    point_size_range: list[float] = None,
    point_size_strategy: str = None,
    point_label_weight_by: str = None,
    point_cluster_by: str = None,
    point_cluster_strength_by: str = None,
    point_include_columns: list[str] = None,
    point_timeline_by: str = None,
    link_color: Union[str, list[float]] = None,
    link_greyout_opacity: float = None,
    link_width: float = None,
    link_width_scale: float = None,
    link_arrows: bool = None,
    link_arrows_size_scale: float = None,
    link_visibility_distance_range: list[float] = None,
    link_visibility_min_transparency: float = None,
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
    disable_simulation: bool = None,
    simulation_decay: float = None,
    simulation_gravity: float = None,
    simulation_center: float = None,
    simulation_repulsion: float = None,
    simulation_repulsion_theta: float = None,
    simulation_repulsion_quadtree_levels: float = None,
    simulation_link_spring: float = None,
    simulation_link_distance: float = None,
    simulation_link_dist_random_variation_range: list[Any] = None,
    simulation_repulsion_from_mouse: float = None,
    simulation_friction: float = None,
    simulation_cluster: float = None,
    background_color: Union[str, list[float]] = None,
    space_size: int = None,
    hovered_point_cursor: str = None,
    render_hovered_point_ring: bool = None,
    hovered_point_ring_color: Union[str, list[float]] = None,
    focused_point_ring_color: Union[str, list[float]] = None,
    focused_point_index: int = None,
    render_links: bool = None,
    curved_links: bool = None,
    curved_link_segments: int = None,
    curved_link_weight: float = None,
    curved_link_control_point_distance: float = None,
    use_quadtree: bool = None,
    show_FPS_monitor: bool = None,
    pixel_ratio: float = None,
    scale_points_on_zoom: bool = None,
    initial_zoom_level: float = None,
    disable_zoom: bool = None,
    enable_drag: bool = None,
    fit_view_on_init: bool = None,
    fit_view_delay: float = None,
    fit_view_padding: float = None,
    fit_view_duration: float = None,
    fit_view_by_points_in_rect: list[list[float]] = None,
    random_seed: Union[int, str] = None,
    show_labels: bool = None,
    show_dynamic_labels: bool = None,
    show_labels_for: list[str] = None,
    show_top_labels: bool = None,
    show_top_labels_limit: int = None,
    static_label_weight: float = None,
    dynamic_label_weight: float = None,
    label_margin: float = None,
    show_hovered_point_label: bool = None,
    disable_point_size_legend: bool = None,
    disable_link_width_legend: bool = None,
    disable_point_color_legend: bool = None,
    disable_link_color_legend: bool = None,
    api_key: str = None,
    clicked_point_index: int = None,
    clicked_point_id: str = None,
    selected_point_indices: list[int] = None,
    selected_point_ids: list[str] = None,
    changePoints: Callable[[Dict[str, Any]], Any] = None,
    changeLinks: Callable[[Dict[str, Any]], Any] = None,
    # extra params ---------------------------------------------------------------------
    copy_before_ingress: bool = True,  # whether to make a copy the points and links before applying ingress
    data_resolution: Callable[
        [CosmoKwargs, Data], CosmoKwargs
    ] = prioritize_points,  # What to do with data (how to integrate it into the cosmo kwargs)
    validate_kwargs: Callable[
        [CosmoKwargs], CosmoKwargs
    ] = validate_kwargs,  # function to apply after the ingress transformations
):
    """
    Thin layer over CosmographWidget to provide a base interface to the widget object,
    with signature, docs with argument descriptions, and a more flexible interface
    comprising some data processing, argument aliasing and validation, error handling,
    etc.

    :param data: Convenience argument whose value will be used for either the points
        or links argument.
    :param ingress: A function or sequence of functions that will be applied to the
        kwargs before they are passed to the Cosmograph constructor.
    :param copy_before_ingress: Whether to make a copy of the points and links before
        applying the ingress transformations. This is so that the original data is not
        modified by the ingress functions.
    :param data_resolution: A function that will be used to resolve the data argument.
        This is the function that takes care of how to handle the data argument,
    :param validate_kwargs: A function that will be applied to the kwargs after the
        ingress transformations. This is the function that will validate the kwargs
        before they are passed to the Cosmograph constructor.

    """
    # Get the arguments as a dictionary
    kwargs = locals().copy()

    # If there's no data arguments (data, points, links)
    # return a partial function with other settings
    if all(val is None for val in map(kwargs.get, ["data", "points", "links"])):
        _ = kwargs.pop("data")
        return partial(cosmo, **kwargs)

    # extract all arguments that are not base cosmograph arguments
    # (and leaving kwargs with only the cosmograph arguments)
    data, ingress, copy_before_ingress, data_resolution, validate_kwargs = map(
        kwargs.pop,
        [
            "data",
            "ingress",
            "copy_before_ingress",
            "data_resolution",
            "validate_kwargs",
        ],
    )

    # put data in points or links according to the
    kwargs = data_resolution(kwargs, data)

    # process ingress
    if callable(ingress):
        ingress = (ingress,)

    if copy_before_ingress:
        ingress = (copy_points_and_links,) + tuple(ingress)

    # apply the ingress transformations one by one
    for kwargs_trans in ingress:
        kwargs = kwargs_trans(kwargs)

    # remove all items that have None values
    kwargs = remove_none_values(kwargs)

    # validate the kwargs
    kwargs = validate_kwargs(kwargs)

    # If api_key is None, use the global one if available
    if kwargs.get('api_key') is None:
        global_api_key = get_api_key()
        if global_api_key is not None:
            kwargs['api_key'] = global_api_key

    # Make a Cosmograph widget instance with these kwargs
    return Cosmograph(**kwargs)


# cosmo.ingress = dflt_cosmo_ingress


# Note: Possibly deprecated
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
        validate_kwargs(self.kwargs)

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

from typing import List
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
