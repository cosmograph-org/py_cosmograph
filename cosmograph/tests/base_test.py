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
