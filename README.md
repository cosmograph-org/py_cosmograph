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
  point_include_columns=['value'],
  point_label_by='label',
  link_include_columns=['value'],
)
widget
```

The widget will render an interactive graph visualization inline, allowing you to 
explore and manipulate your data directly. 

![](https://github.com/user-attachments/assets/328ff643-dcd8-479b-938a-40d43246cd39)

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
    point_size_scale=0.01,  # often have to play with this number to get the size right
)
g
```

![image](https://github.com/user-attachments/assets/22bf49e9-a4ee-41f4-ba74-4557a0b52d98)

Zooming in a bit:

![image](https://github.com/user-attachments/assets/ad81eb4e-401d-433b-945a-f460a44c81de)


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
    point_size_scale=0.01,  # often have to play with this number to get the size right
    space_size=8112
)
h
```

![image](https://github.com/user-attachments/assets/23312ab7-7b28-495d-a69e-9b6e44c61842)

Zooming in a bit:

![image](https://github.com/user-attachments/assets/8cf95878-b4a3-49ae-985e-e017d346886b)


## 🎉 More Examples

Try out the Cosmograph widget in Google Colab with these example notebooks:

- [Cosmograph Widget (Colab notebook) ✌️](https://colab.research.google.com/drive/1d0Gsn6KlCNCjPp8n8fpm82ctBpARasVX)
- [Mobius in Cosmograph Widget (Colab notebook)🎗️](https://colab.research.google.com/drive/1-FlUSyRAgdhXT6rNyi3uYrIIlGX8gRuk)
- [Clusters in Cosmograph (Colab notebook) 🫧](https://colab.research.google.com/drive/1Rt8rmmeMuWyFjEqae2DdJ3NYymtjC9cT)
- [English Words 🔤](https://colab.research.google.com/drive/1jZ2tPJw4gHpTCJVwCggRPWLmasfJIjPc?usp=sharing)


## 🛸 Issues and Feedback

Submit issues to https://github.com/cosmograph-org/py_cosmograph/issues.


## 👩🏻‍🚀 Contact and More Info

🌎 [Website](https://cosmograph.app)

📩 [Email](mailto:hi@cosmograph.app)

👾 [Join the Cosmograph Discord Community](https://discord.gg/Rv8RUQuzsx)

