# Cosmograph

The **Cosmograph Widget** brings the power of Cosmograph's GPU-accelerated force layout graph visualization right into your Jupyter notebooks. Built on top of [Anywidget](https://anywidget.dev/), this widget provides a seamless, interactive graph exploration experience directly within your data science workflow, making it easier than ever to visualize complex data relationships and embeddings.


## ✨ Key Features

- **Interactive Visualization**: Pan, zoom, select, and hover to explore large, complex network graphs right in your notebook.
- **GPU-Acceleration**: Powered by [@cosmograph/cosmos](http://github.com/cosmograph-org/cosmos), it delivers smooth interactions and rapid rendering of large-scale graphs.
- **Seamless Integration**: Embeds naturally into Jupyter notebooks, JupyterLab, and other notebook-based environments.
- **Rich Configuration API**: Fine-tune graph appearance, behavior, and layout parameters through easy-to-use Python APIs.

## 🚀 Installation

Note: You'll need python 3.10 or greater. 

To install the Cosmograph widget, simply run:

```sh
pip install cosmograph
```

Once installed, you can start using it in your notebooks immediately.

[![PyPI Version](https://img.shields.io/pypi/v/cosmograph)](https://pypi.org/project/cosmograph/)


## 🛠️ Quick Start

After installation, you can import and use the widget in any Python-based notebook environment:

### Tiny example

```python
import pandas as pd
from cosmograph import cosmo

points = pd.DataFrame({
    'id': [1, 2, 3, 4, 5],
    'label': ['Node A', 'Node B', 'Node C', 'Node D', 'Node E'],
    'value': [10, 20, 15, 25, 30],
    'category': ['A', 'B', 'A', 'B', 'A']
})

links = pd.DataFrame({
    'source': [1, 2, 3, 1, 2],
    'target': [2, 3, 4, 5, 4],
    'value': [1.0, 2.0, 1.5, 0.5, 1.8]
})

widget = cosmo(
  points=points,
  links=links,
  point_id_by='id',
  link_source_by='source',
  link_target_by='target',
  point_color_by='category',
  point_label_by='label',
  point_size_by='value'
)
widget
```

The widget will render an interactive graph visualization inline, allowing you to 
explore and manipulate your data directly. 

![](https://github.com/user-attachments/assets/954a0556-ad8d-48f4-9295-8e547e9a338e)

You also use the widget object to interact with the rendered graph.

```python
widget.fit_view()  # recenter the view (often useful when you've lost your graph (or within your graph)
widget.selected_point_ids  # if you've selected some points and want to get info about the selection...
# etc.
```

### Nicer example

Let's download a big dataset of English words, plus some hyponym-hypernym relationships. 
(A hyponym-hypernym relationship is a “type-of” relationship where a hyponym is a more 
specific term (e.g., “dog”) and a hypernym is a broader term (e.g., “animal”).)

```python
import pandas as pd
from cosmograph import cosmo

df = pd.read_parquet('https://www.dropbox.com/scl/fi/4mnk1e2wx31j9mdsjzecy/wordnet_feature_meta.parquet?rlkey=ixjiiso80s1uk4yhx1v38ekhm&dl=1')
hyponyms = pd.read_parquet('https://www.dropbox.com/scl/fi/pl72ixv34soo1o8zanfrz/hyponyms.parquet?rlkey=t4d606fmq1uinn29qmli7bx6r&dl=1')
```

Peep at the data:

```python
print(f"{df.shape=}")
df.iloc[0]
```

```python
print(f"{hyponyms.shape=}")
hyponyms.iloc[0]
```

Let's plot the data using the [UMAP projection](https://umap-learn.readthedocs.io/en/latest/) 
of the (OpenAI) [embeddings](https://www.deepset.ai/blog/the-beginners-guide-to-text-embeddings)
of the words, coloring by "part-of-speech" and sizing by the usage frequency of the word.

```python
g = cosmo(
    df,
    point_id_by='lemma',
    point_label_by='word',
    point_x_by='umap_x',
    point_y_by='umap_y',
    point_color_by='pos',
    point_size_by='frequency',
    point_size_scale=6,  # often have to play with this number to get the size right
    disable_point_size_legend=True
)
g
```

![image](https://github.com/user-attachments/assets/3c54f524-349e-45b7-96ae-64864c76033a)

Zooming in a bit:

![image](https://github.com/user-attachments/assets/b915d07f-06da-497a-a7e3-469ffdd5e1f2)


And now, let's put some hypernym-hyponym links, and let the network converge to a stable 
layout using a force-directed simulation (try it yourself, the convergence is pretty!)

```python
h = cosmo(
    points=df,
    links=hyponyms,
    link_source_by='source',
    link_target_by='target',
    point_id_by='lemma',
    point_label_by='word',
    # point_x_by='umap_x',
    # point_y_by='umap_y',
    point_color_by='pos',
    point_size_by='frequency',
    point_size_scale=0.2,  # often have to play with this number to get the size right
    disable_point_size_legend=True
)
h
```

![image](https://github.com/user-attachments/assets/36e79cbf-d5e5-4afa-8bc5-59ae4c452082)

Zooming in a bit:

![image](https://github.com/user-attachments/assets/e988950d-9f53-40c2-8b77-18cfb92efb50)

## 📐 Getting the point coordinates back

Once the simulation has settled, you can pull the x, y coordinates of every point back into Python -- handy for redrawing the graph in matplotlib, exporting an SVG, or making a figure for a paper.

```python
graph = cosmo(points=points, links=links, point_id_by='id',
              link_source_by='source', link_target_by='target')
graph  # display it and let the simulation settle
```

Then, in a *later* cell (the widget answers over the notebook's comm channel, so the reply cannot arrive in the cell that asks for it):

```python
graph.request_point_positions()
```

```python
graph.point_positions  # DataFrame with id, x, y -- one row per point
```

In a notebook that supports top-level `await` you can do both in one go:

```python
coords = await graph.fetch_point_positions()
```

Coordinates are in Cosmograph's space coordinates -- the same system as `point_x_by` / `point_y_by`, bounded by `space_size`.

## 🔑 API Key Setup and Project Export

### Setting up API Key

If you have a Cosmograph API key, you can set it globally to authenticate with Cosmograph services:

```python
from cosmograph import set_api_key

# Set your API key globally (this will apply to all cosmograph instances)
set_api_key("your-api-key-here")
```

Once set, all cosmograph widgets will automatically use this API key for authentication.

### Exporting Projects to Cosmograph Platform

You can export your cosmograph visualization as a project to the [Cosmograph platform](https://run.cosmograph.app), making it accessible via a web interface for sharing and further collaboration.

```python
import pandas as pd
from cosmograph import cosmo, set_api_key

# Set your API key first
set_api_key("your-api-key-here")

# Create your visualization
points = pd.DataFrame({
    'id': [1, 2, 3, 4, 5],
    'label': ['Node A', 'Node B', 'Node C', 'Node D', 'Node E'],
    'value': [10, 20, 15, 25, 30],
    'category': ['A', 'B', 'A', 'B', 'A']
})

links = pd.DataFrame({
    'source': [1, 2, 3, 1, 2],
    'target': [2, 3, 4, 5, 4],
    'value': [1.0, 2.0, 1.5, 0.5, 1.8]
})

graph = cosmo(
    points=points,
    links=links,
    point_id_by='id',
    link_source_by='source',
    link_target_by='target',
    point_color_by='category',
    point_label_by='label',
    point_size_by='value'
)

# Export to Cosmograph platform
graph.export_project_by_name("My Network Visualization")
```

The exported project will be available on the [Cosmograph platform](https://run.cosmograph.app).


## 🎉 More Examples

Try out the Cosmograph widget in Google Colab with these example notebooks:

- [Timeline in Cosmograph Widget ⏳](https://colab.research.google.com/drive/1fK7SLsoMFiDt9_42z9W7jo0z43yCL-CR)
- [Real-Time Data Exploration with Cosmograph Widget 🪄](https://colab.research.google.com/drive/1bL3hcPbP2xPuxrtgmYaTU_hChCrdCp2Q)
- [Mobius in Cosmograph Widget 🎗️](https://colab.research.google.com/drive/1-FlUSyRAgdhXT6rNyi3uYrIIlGX8gRuk)
- [Clusters in Cosmograph 🫧](https://colab.research.google.com/drive/1Rt8rmmeMuWyFjEqae2DdJ3NYymtjC9cT)
- [English Words 🔤](https://colab.research.google.com/drive/1TocOW1ZkwwDapNTY0F-lBGmhrs7BtIPK)


## 🛸 Issues and Feedback

Submit issues to https://github.com/cosmograph-org/py_cosmograph/issues.


## 👩🏻‍🚀 Contact and More Info

🌎 [Website](https://cosmograph.app)

📩 [Email](mailto:hi@cosmograph.app)

👾 [Join the Cosmograph Discord Community](https://discord.gg/Rv8RUQuzsx)

🛠️ [Development Setup](DEVELOPMENT.md)
