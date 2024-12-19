
# Cosmograph

The **Cosmograph Widget** brings the power of Cosmograph's GPU-accelerated force layout graph visualization right into your Jupyter notebooks. Built on top of [Anywidget](https://anywidget.dev/), this widget provides a seamless, interactive graph exploration experience directly within your data science workflow, making it easier than ever to visualize complex data relationships and embeddings.

## ✨ Key Features

- **Interactive Visualization**: Pan, zoom, select, and hover to explore large, complex network graphs right in your notebook.
- **GPU-Acceleration**: Powered by [@cosmograph/cosmos](http://github.com/cosmograph-org/cosmos), it delivers smooth interactions and rapid rendering of large-scale graphs.
- **Seamless Integration**: Embeds naturally into Jupyter notebooks, JupyterLab, and other notebook-based environments.
- **Rich Configuration API**: Fine-tune graph appearance, behavior, and layout parameters through easy-to-use Python APIs.

## 🚀 Installation

To install the Cosmograph widget, simply run:

```sh
pip install cosmograph
```

Once installed, you can start using it in your notebooks immediately.

[![PyPI Version](https://img.shields.io/pypi/v/cosmograph)](https://pypi.org/project/cosmograph/)


## 🛠️ Quick Start

After installation, you can import and use the widget in any Python-based notebook environment:

```python
from cosmograph import cosmo

points = pd.DataFrame({
    'id': [1, 2, 3, 4, 5],
    'label': ['Node A', 'Node B', 'Node C', 'Node D', 'Node E'],
    'value': [10, 20, 15, 25, 30]
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

  point_include_columns=['value'],
  point_label_by='label',
  link_include_columns=['value'],
)
widget
```

The widget will render an interactive graph visualization inline, allowing you to 
explore and manipulate your data directly. 


## 🎉 Examples

Try out the Cosmograph widget in Google Colab with these example notebooks:

- [Cosmograph Widget (Colab notebook) ✌️](https://colab.research.google.com/drive/1d0Gsn6KlCNCjPp8n8fpm82ctBpARasVX)
- [Mobius in Cosmograph Widget (Colab notebook)🎗️](https://colab.research.google.com/drive/1-FlUSyRAgdhXT6rNyi3uYrIIlGX8gRuk)
- [Clusters in Cosmograph (Colab notebook) 🫧](https://colab.research.google.com/drive/1Rt8rmmeMuWyFjEqae2DdJ3NYymtjC9cT)

## 🛸 Issues and Feedback

Submit issues to https://github.com/cosmograph-org/py_cosmograph/issues.

## 👩🏻‍🚀 Contact and More Info

🌎 [Website](https://cosmograph.app)

📩 [Email](mailto:hi@cosmograph.app)

👾 [Join the Cosmograph Discord Community](https://discord.gg/Rv8RUQuzsx)
