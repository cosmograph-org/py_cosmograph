# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options.
# For a full list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.

import os
import sys

sys.path.insert(0, os.path.abspath('..'))

# -- Project information -----------------------------------------------------
from epythet.config_parser import parse_config
from pathlib import Path

project, copyright, author, release, display_name = parse_config(
    Path(__file__).absolute().parent.parent / 'setup.cfg'
)

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    'sphinx_toggleprompt',
    'sphinx_copybutton',
    'sphinx.ext.autodoc',  # Include documentation from docstrings
    'sphinx.ext.doctest',  # Test snippets in the documentation
    'sphinx.ext.githubpages',  # This extension creates .nojekyll file
    'sphinx.ext.graphviz',  # Add Graphviz graphs
    'sphinx.ext.napoleon',  # Support for NumPy and Google style docstrings
    'sphinx.ext.todo',  # Support for todo items
    'sphinx.ext.viewcode',  # Add links to highlighted source code
    'myst_parser',  # Parse .md files
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = 'sphinx_rtd_theme'

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']


# -- Options for Markdown support -------------------------------------------
# TODO: fix md support so that it doesn't interfere with rst docs
# import commonmark
#
#
# def docstring(app, what, name, obj, options, lines):
#     md = '\n'.join(lines)
#     ast = commonmark.Parser().parse(md)
#     rst = commonmark.ReStructuredTextRenderer().render(ast)
#     lines.clear()
#     lines += rst.splitlines()
#
#
# def setup(app):
#     app.connect('autodoc-process-docstring', docstring)


toggleprompt_offset_right = 30
