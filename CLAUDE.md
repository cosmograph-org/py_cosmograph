# py_cosmograph — agent guide

The official **Python wrapper** for Cosmograph (the `cosmograph` PyPI package). It exposes one main
function — **`cosmo(...)`** — that renders point/graph visualizations from pandas DataFrames in a
Jupyter anywidget, plus a hosted-platform export path.

## The one call
```python
from cosmograph import cosmo
cosmo(points=df, links=df, point_id_by="id", point_color_by="group",
      point_size_by="score", link_source_by="src", link_target_by="tgt")
```
`cosmo()` accepts many keyword params; many **`*_by` params** map DataFrame columns to visual
attributes. Data ships to JS as Arrow IPC (notebook) or Parquet (platform export).

## Key files
- `cosmograph/data/params_ssot.json` — **the param SSOT** (`{name,default,annotation,description}`).
- `cosmograph/util.py` — `_params_ssot()`, `cosmograph_base_signature()`, `cosmograph_base_docs()`,
  `str_to_annotation` (call these to introspect params at runtime).
- `cosmograph/base.py` — `cosmo()`: param order, ingress hooks, deprecated-name remap, aliases.
- `cosmograph/widget/__init__.py` — the `Cosmograph` anywidget; traitlets = precise wire types.
- `cosmograph/widget/export_project/` — DataFrame→Parquet + hosted-platform column mapping.
- `cosmograph/validation.py` — minimal record validators (point needs `id`; link needs `source`+`target`).
- `js/config-props.json` — snake_case→camelCase param-name mapping.
- `cosmograph/_dev_utils/` — dev-only SSOT generator (needs network/extra deps; don't run at runtime).

**Ignore for params:** `meta.json` (esbuild bundle metafile, not parameters).

## Caveats
- The local repo's `params_ssot.json` may differ from the installed pip package due to version drift; handle version compatibility accordingly.
- App-only params (`point_shape_by`, `point_image_url_by`, `*ByFn`) are not in the Python SSOT.

## Workflow
See `DEVELOPMENT.md`. Python + a small JS/TS widget build. Tests in `tests/`.

## Broader context
This is the Python interface the whole data-prep effort sits on. See the `cosmograph-ssot`,
`cosmo-data-format`, and `cosmo-data-mapping` skills in the parent `c/` workspace (`c/.claude/skills/`).
