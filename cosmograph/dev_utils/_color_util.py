"""Utils for color """

import re
from typing import Any, Callable, Sequence, Union
from numbers import Number

import pandas as pd
import numpy as np

from cosmograph.util import color_names_set

html_color_names_set = color_names_set

# Regular expression to match hex color codes
rgb_hex_color_re = re.compile(r'^#(?:[0-9a-fA-F]{3}){1,2}$')


def is_hex_color_str(x: Any) -> bool:
    """Check if x is a hex color string."""
    return isinstance(x, str) and bool(rgb_hex_color_re.match(x))


def is_rgb_color_tuple(x: Any) -> bool:
    """Check if x is an RGB color tuple of integers."""
    return (
        isinstance(x, Sequence)
        and len(x) == 3
        and all(isinstance(x_, Number) for x_ in x)
    )


def is_html_color_name(x: Any) -> bool:
    """Check if x is a standard HTML color name."""
    return isinstance(x, str) and x.lower() in html_color_names_set


def is_valid_color(x: Any) -> bool:
    """Check if x is a valid color specification."""
    return is_hex_color_str(x) or is_rgb_color_tuple(x) or is_html_color_name(x)


def get_matplotlib_palette(
    palette: Union[str, Callable], categorical: bool = True
) -> Callable:
    """
    Get a palette function from Matplotlib.

    Parameters:
    - palette (str or Callable): Palette name or custom function.
    - categorical (bool): Whether the data is categorical.

    Returns:
    - palette_func (Callable): Function mapping values to colors.
    """
    import matplotlib.pyplot as plt
    import matplotlib.cm as cm

    if palette is None:
        palette = 'tab10' if categorical else 'viridis'

    if isinstance(palette, str):
        if categorical:
            cmap = plt.colormaps[palette]
            if hasattr(cmap, 'colors') and len(cmap.colors) < 256:
                colors = [
                    tuple(c[:3]) for c in cmap.colors
                ]  # Ensure colors are RGB tuples
            else:
                # Generate discrete colors from continuous colormap
                colors = [tuple(cmap(i / cmap.N)[:3]) for i in range(cmap.N)]

            def palette_func(i):
                return colors[i % len(colors)]

            return palette_func
        else:
            cmap = plt.colormaps[palette]

            def palette_func(x):
                return tuple(cmap(x)[:3])  # Return RGB tuple

            return palette_func
    elif callable(palette):
        return palette
    else:
        raise ValueError("Invalid palette specification.")


def map_values_to_colors(
    values: Sequence[Any],
    palette: Union[str, Callable],
    get_palette_func: Callable,
) -> Sequence[Any]:
    """
    Map data values to colors using the specified palette.

    Parameters:
    - values (Sequence): Data values to map.
    - palette (str or Callable): Palette name or custom function.
    - get_palette_func (Callable): Function to obtain palette function.

    Returns:
    - colors (Sequence): Mapped colors.
    """
    values = pd.Series(values)
    valid_mask = values.notnull()
    valid_values = values[valid_mask]

    if pd.api.types.is_numeric_dtype(valid_values):
        # Numerical data
        palette_func = get_palette_func(palette, categorical=False)
        # Normalize values to [0, 1]
        min_val = valid_values.min()
        max_val = valid_values.max()
        if min_val == max_val:
            norm = pd.Series(0.5, index=valid_values.index)
        else:
            norm = (valid_values - min_val) / (max_val - min_val)
        mapped_colors = norm.apply(palette_func)
    else:
        # Categorical data
        palette_func = get_palette_func(palette, categorical=True)
        categories = pd.Categorical(valid_values).categories
        color_map = {cat: palette_func(i) for i, cat in enumerate(categories)}
        mapped_colors = valid_values.map(color_map)

    colors = pd.Series([None] * len(values), index=values.index)
    colors[valid_mask] = mapped_colors
    return colors.tolist()


def resolve_colors(
    data: pd.DataFrame,
    color: Any = None,
    *,
    color_spec_kind: str = None,
    palette: Union[str, Callable] = None,
    default_color: Any = 'blue',
    get_palette_func: Callable = None,
    is_valid_color_func: Callable = None,
) -> Sequence[Any]:
    """
    Resolves various color specifications into an explicit array of colors corresponding to the data points in a pandas DataFrame.

    The `resolve_colors` function accepts different types of color inputs and maps them to a list of colors suitable for plotting. It intelligently infers the kind of color input provided but also allows explicit specification through the `color_spec_kind` parameter.

    **Parameters:**

    - **data** (`pd.DataFrame`):
      The DataFrame containing the data points to be visualized.

    - **color** (`Any`, optional):
      Color specification or data for color mapping. It can be:
        - A single valid color specification (e.g., `'red'`, `'#FF0000'`, `(255, 0, 0)`).
        - An array-like of valid color specifications.
        - An array-like of numerical or categorical data to be mapped to colors.
        - A column name in `data` whose values determine the colors of the data points.

    - **color_spec_kind** (`str`, optional):
      Explicitly specifies the kind of color input provided in `color`. If not provided, the function attempts to infer it. Possible values are:
        - `'single_color'`: `color` is a single color specification.
        - `'color_spec_array'`: `color` is an array of color specifications.
        - `'mixed_color_spec_array'`: `color` is an array with mixed valid color specifications and invalid values.
        - `'color_categorical_array'`: `color` is an array of categorical data to be mapped to colors.
        - `'color_numeric_array'`: `color` is an array of numerical data to be mapped to colors.
        - `'color_spec_field'`: `color` is a column name in `data` containing color specifications.
        - `'color_categorical_field'`: `color` is a column name in `data` containing categorical data to be mapped to colors.
        - `'color_numeric_field'`: `color` is a column name in `data` containing numerical data to be mapped to colors.

    - **palette** (`str` or `Callable`, optional):
      Colormap or palette used to map data values to colors. It can be a string recognized by Matplotlib or a custom mapping function.

    - **default_color** (`Any`, optional):
      Default color to use when no other color is specified or as a fallback for invalid or missing values. Defaults to `'blue'`.

    - **get_palette_func** (`Callable`, optional):
      Function to obtain a palette function. If not provided, a default function using Matplotlib colormaps is used.

    - **is_valid_color_func** (`Callable`, optional):
      Function to validate color specifications. If not provided, a default function is used.

    **Returns:**

    - **colors** (`list`):
      List of color specifications for each data point in `data`.

    **Raises:**

    - **ValueError**:
      If the input is invalid or if the specified `color_spec_kind` does not match the provided `color`.

    **Examples:**

    Basic usage with a single color:

    >>> import pandas as pd
    >>> import numpy as np
    >>> data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
    >>> colors = resolve_colors(data, color='red')
    >>> colors
    ['red', 'red', 'red']

    Using an array of color specifications:

    >>> colors = resolve_colors(data, color=['red', 'green', 'blue'])
    >>> colors
    ['red', 'green', 'blue']

    Mapping numerical data to colors using a palette:

    >>> data['value'] = [0.1, 0.5, 0.9]
    >>> colors = resolve_colors(data, color=data['value'], palette='viridis')
    >>> len(colors)
    3
    >>> all(isinstance(c, (tuple, np.ndarray)) for c in colors)  # Colors are RGB sequences
    True

    Mapping categorical data to colors via a data column:

    >>> data['category'] = ['A', 'B', 'A']
    >>> colors = resolve_colors(data, color='category', palette='Set1')
    >>> colors  # doctest: +SKIP
    [(0.8941176470588235, 0.10196078431372549, 0.10980392156862745),
     (0.21568627450980393, 0.49411764705882355, 0.7215686274509804),
     (0.8941176470588235, 0.10196078431372549, 0.10980392156862745)]

    Handling missing values with a default color:

    >>> colors = resolve_colors(data, color=[None, 'green', None], default_color='gray')
    >>> colors
    ['gray', 'green', 'gray']

    Using a custom palette function:

    >>> def custom_palette(value):
    ...     return 'green' if value > 0.5 else 'orange'
    >>> colors = resolve_colors(data, color=data['value'], palette=custom_palette)
    >>> colors
    ['orange', 'orange', 'green']

    Explicitly specifying the color specification kind:

    >>> colors = resolve_colors(data, color='value', color_spec_kind='color_numeric_field', palette='viridis')
    >>> len(colors)
    3

    **Notes:**

    - If `color_spec_kind` is not provided, the function attempts to infer it based on the type and content of `color`.
    - The function relies on Matplotlib colormaps when using palettes. Ensure Matplotlib is installed.
    - Invalid or missing color specifications are replaced with `default_color`.
    - Custom palette functions can be provided via the `palette` parameter.
    - The `get_palette_func` parameter allows customization of how palettes are obtained.

    **Dependencies:**

    - **pandas**: Used for data manipulation.
    - **numpy**: Used for array handling.
    - **Matplotlib** (optional): Used for colormap functions when mapping data values to colors.

    **Helper Functions:**

    - **is_valid_color_func**:
      Validates whether a value is a valid color specification (e.g., hex code, RGB tuple, HTML color name).

    - **get_palette_func**:
      Obtains a palette function based on the provided palette name or custom function.

    **Internal Logic:**

    1. **Input Validation:**
       - If `color` is `None`, the function returns a list of `default_color`.
       - If `color_spec_kind` is provided, it is used to process `color`.
       - If `color_spec_kind` is not provided, the function infers it based on `color`.

    2. **Processing Based on `color_spec_kind`:**
       - **'single_color'**:
         Applies a single color to all data points.
       - **'color_spec_array'**:
         Uses an array of color specifications directly.
       - **'mixed_color_spec_array'**:
         Handles arrays with mixed valid color specifications and invalid values, replacing invalid values with `default_color`.
       - **'color_categorical_array'** or **'color_numeric_array'**:
         Maps array-like data to colors using the specified palette.
       - **'color_spec_field'**, **'color_categorical_field'**, or **'color_numeric_field'**:
         Processes a column in `data` to determine colors.

    3. **Handling Missing or Invalid Colors:**
       - Replaces any `None` or invalid color specifications with `default_color`.

    **Usage Tips:**

    - **Specifying `color_spec_kind`:**
      Use this parameter if the function cannot correctly infer the kind of `color` you're providing or if you want to ensure it is processed in a specific way.

    - **Custom Palettes:**
      If you have a specific way of mapping data values to colors, provide a custom function via the `palette` parameter.

    - **Valid Color Specifications:**
      The function accepts standard HTML color names, hex color codes (e.g., `'#FF0000'`), and RGB tuples (e.g., `(255, 0, 0)`).

    **Limitations:**

    - The function does not support color gradients beyond mapping numerical values to colors using a colormap.
    - When using categorical data mapping, ensure that the number of unique categories is manageable to avoid color repetition or indistinguishable colors.

    **Example with Error Handling:**

    >>> try:
    ...     colors = resolve_colors(data, color=['red', 'green'], color_spec_kind='color_spec_array')
    ... except ValueError as e:
    ...     print(e)
    Length of 'color' array does not match length of data.

    **Version History:**

    - **v1.0**: Initial implementation with intelligent inference of `color_spec_kind` and support for various color specifications.
    - **v1.1**: Updated to handle mixed arrays of valid colors and invalid values.

    **Author:**

    - Developed by [Your Name], inspired by discussions on function design and usability.

    **References:**

    - Matplotlib Colormaps: https://matplotlib.org/stable/tutorials/colors/colormaps.html
    - Pandas Documentation: https://pandas.pydata.org/docs/

    """

    if get_palette_func is None:
        get_palette_func = get_matplotlib_palette

    if is_valid_color_func is None:
        is_valid_color_func = is_valid_color

    num_data_points = len(data)

    if color is None:
        # Use default color
        colors = [default_color] * num_data_points
        return colors

    # Infer color_spec_kind if not specified
    if color_spec_kind is None:
        color_spec_kind = infer_color_spec_kind(color, data, is_valid_color_func)

    # Validate color_spec_kind
    valid_kinds = {
        'single_color',
        'color_spec_array',
        'color_categorical_array',
        'color_numeric_array',
        'color_spec_field',
        'color_categorical_field',
        'color_numeric_field',
        'mixed_color_spec_array',
    }
    if color_spec_kind not in valid_kinds:
        raise ValueError(
            f"Invalid color_spec_kind '{color_spec_kind}'. Must be one of {valid_kinds}."
        )

    # Process based on color_spec_kind
    if color_spec_kind == 'single_color':
        if not is_valid_color_func(color):
            raise ValueError("Invalid color specification for 'single_color'.")
        colors = [color] * num_data_points

    elif color_spec_kind == 'color_spec_array':
        color_values = pd.Series(color)
        if len(color_values) != num_data_points:
            raise ValueError("Length of 'color' array does not match length of data.")
        if not color_values.apply(is_valid_color_func).all():
            raise ValueError(
                "All elements in 'color' must be valid color specifications."
            )
        colors = color_values.tolist()

    elif color_spec_kind == 'mixed_color_spec_array':
        color_values = pd.Series(color)
        if len(color_values) != num_data_points:
            raise ValueError("Length of 'color' array does not match length of data.")
        colors = [c if is_valid_color_func(c) else default_color for c in color_values]

    elif color_spec_kind in {'color_categorical_array', 'color_numeric_array'}:
        color_values = pd.Series(color)
        if len(color_values) != num_data_points:
            raise ValueError("Length of 'color' array does not match length of data.")
        colors = map_values_to_colors(color_values, palette, get_palette_func)

    elif color_spec_kind in {
        'color_spec_field',
        'color_categorical_field',
        'color_numeric_field',
    }:
        if not isinstance(color, str) or color not in data.columns:
            raise ValueError(f"'{color}' must be a column name in data.")
        color_values = data[color]
        if color_spec_kind == 'color_spec_field':
            if not color_values.apply(is_valid_color_func).all():
                raise ValueError(
                    "All elements in 'color' field must be valid color specifications."
                )
            colors = color_values.tolist()
        elif color_spec_kind == 'mixed_color_spec_array':
            colors = [
                c if is_valid_color_func(c) else default_color for c in color_values
            ]
        else:
            colors = map_values_to_colors(color_values, palette, get_palette_func)
    else:
        raise ValueError(f"Unhandled color_spec_kind '{color_spec_kind}'.")

    # Replace invalid or missing colors with default_color
    colors = [
        (
            c
            if c is not None and not pd.isnull(c) and is_valid_color_func(c)
            else default_color
        )
        for c in colors
    ]

    return colors


def infer_color_spec_kind(color, data, is_valid_color_func):
    """
    Infers the color_spec_kind based on the type and value of 'color'.
    """
    if is_valid_color_func(color):
        return 'single_color'
    elif isinstance(color, (list, tuple, np.ndarray, pd.Series)):
        color_values = pd.Series(color)
        valid_mask = color_values.apply(is_valid_color_func)
        if valid_mask.all():
            return 'color_spec_array'
        elif valid_mask.any():
            return 'mixed_color_spec_array'
        elif pd.api.types.is_numeric_dtype(color_values):
            return 'color_numeric_array'
        else:
            return 'color_categorical_array'
    elif isinstance(color, str) and color in data.columns:
        color_values = data[color]
        if color_values.apply(is_valid_color_func).all():
            return 'color_spec_field'
        elif color_values.apply(is_valid_color_func).any():
            return 'mixed_color_spec_array'
        elif pd.api.types.is_numeric_dtype(color_values):
            return 'color_numeric_field'
        else:
            return 'color_categorical_field'
    else:
        raise ValueError(
            "Unable to infer color_spec_kind. Please specify it explicitly."
        )
