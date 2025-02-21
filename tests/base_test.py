"""Test base.py"""


def test_cosmo_import():
    """Just test that we can import cosmo (which triggers many object constructions)"""
    from cosmograph import cosmo

    assert cosmo


def test_cosmo_graph_01_quests():
    # Specify some data
    data = {
        "Quest_Title": ["Dragon Hunt", "Mystic Voyage", "Treasure Seekers"],
        "Map_X": [120, 450, 100],
        "Map_Y": [75, 320, 210],
        "Aura_Color": ["Crimson", "Azure", "Emerald"],
        "Gear_Size": [15, 20, 10],
    }

    # Create a DataFrame containing the data
    import pandas as pd

    df = pd.DataFrame(data)

    # Make the graph

    from cosmograph import cosmo

    graph = cosmo(
        df,
        point_x_by="Map_X",
        point_y_by="Map_Y",
        point_color_by="Aura_Color",
        point_size_by="Gear_Size",
        point_size_scale=7,
        point_label_by="Quest_Title",
    )

    # Check that the graph is a widget

    import anywidget

    assert isinstance(
        graph, anywidget.widget.AnyWidget
    ), "'quest' graph wasn't an anywidget widget instance"


def test_cosmo_partial_and_ingress_01():
    import pytest
    import pandas as pd
    from cosmograph import cosmo, Cosmograph

    # Define the data with whimsical column names
    data_potions = {
        "potion_name": [
            "Elixir of Vitality",
            "Draught of Invisibility",
            "Brew of Fireball",
        ],
        "Brewmaster": ["Elder Willow", "Mistress Shadow", "Master Ignis"],
        "Ingredients": [
            "Dragon Scale, Phoenix Feather, Unicorn Tears",
            "Nightshade, Moonflower, Shadow Essence",
            "Fireroot, Lava Crystal, Unicorn Tears, Ember Dust",
        ],
        "Location_X": [500, 620, 450],
        "Location_Y": [300, 400, 350],
        "potion_color": ["Blue", "White", "Red"],
        "potion_difficulty": [25, 30, 20],
        "potion_popularity": [1, 2, 3],
    }

    # Create a DataFrame to contain this data
    df_potions = pd.DataFrame(data_potions)

    # Test that Cosmograph widget works
    asis = cosmo(
        df_potions,
        point_x_by="Location_X",
        point_y_by="Location_Y",
        point_label_by="potion_name",
        point_size_by="potion_difficulty",
        point_color_by="potion_color",
    )
    assert isinstance(asis, Cosmograph), "asis is not an instance of Cosmograph!"

    # If you were to iterate over different datas or configurations, you could make
    # a "partial" widget constructor that sets the common parameters (just don't include any data, points, or links arguments)
    my_cosmo = cosmo(
        point_x_by="Location_X",
        point_y_by="Location_Y",
        point_label_by="potion_name",
        point_size_by="potion_difficulty",
        point_color_by="potion_color",
    )

    # You my_cosmo is not a widget now...
    assert not isinstance(my_cosmo, Cosmograph)
    # ... but a callable that can be used to create widgets
    assert callable(my_cosmo), "my_cosmo is not callable!"
    # See, let's use it to create a widget
    widget_from_my_cosmo = my_cosmo(df_potions)
    assert isinstance(
        widget_from_my_cosmo, Cosmograph
    ), "widget_from_my_cosmo is not an instance of Cosmograph!"

    # Use pytest.raises to check that TraitError is raised

    from traitlets.traitlets import TraitError

    with pytest.raises(
        TraitError,
        match="The 'point_color_by' trait of a Cosmograph instance expected a unicode string, not the function '<lambda>'",
    ):
        with_functional_color_failing = my_cosmo(
            df_potions,
            point_color_by=lambda x: int(
                "Unicorn Tears" in x["Ingredients"]
            ),  # Invalid point_color_by: It's supposed to be a column name, but it's a function instead!!
        )

    # Introducing ingress. Ingress is a function, or sequence of functions, that
    # transforms the input arguments before they are passed to the Cosmograph constructor.
    #
    # For instance, you could use it to specify that if point_color_by is a function,
    # it should apply this function to the DataFrame rows, creating a temp column to
    # accumulate the results, and then change the point_color_by argument to be the name
    # of that column, thereby being compliant with the expected types.

    def handle_functional_color(kwargs):
        if callable(kwargs.get("point_color_by")):
            point_color_by_func = kwargs["point_color_by"]
            points_copy = kwargs["points"].copy()
            points_copy["_point_color_by"] = points_copy.apply(
                point_color_by_func, axis=1
            )
            kwargs["point_color_by"] = "_point_color_by"
            kwargs["points"] = points_copy
        return kwargs

    # Test case for "with_functional_color"
    with_functional_color = my_cosmo(
        df_potions,
        ingress=handle_functional_color,
        point_color_by=lambda x: int("Unicorn Tears" in x["Ingredients"]),
    )
    assert isinstance(
        with_functional_color, Cosmograph
    ), "with_functional_color is not an instance of Cosmograph!"
