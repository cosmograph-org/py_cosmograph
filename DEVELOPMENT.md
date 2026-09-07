# 🧑‍🚀 Cosmograph Widget Development Guide

🤖 **Tech Stack:** Python 3.10+, JavaScript (ES6), Anywidget, Hatch, Ruff

```text
py_cosmograph/
├── js/              # Source JavaScript
│── cosmograph/
│   └── widget/
|       └── __init__.py
│   └── __about__.py # <- cosmograph version here
│   └── __init__.py
├── tests/           # Test suite
├── pyproject.toml   # Build configuration
└── package.json     # NPM configuration
```

### 🚀 Quick Start
```bash
# Install Hatch (if missing)
pip install hatch

# Install dev dependencies
hatch run pip install -e .

# Run JS build in watch mode
npm run dev
```

### 🧭 Parameter SSOT

`cosmograph/data/params_ssot.json` holds the name, type, default and description of every
`cosmo` parameter. Types, defaults and descriptions come from the TypeScript library, so they
are refreshed rather than edited by hand:

```bash
# fail if params_ssot.json no longer matches the TypeScript sources
python -m cosmograph._dev_utils.params_ssot --check

# refresh it, optionally from a newer build of the TypeScript params SSOT
python -m cosmograph._dev_utils.params_ssot [--source <path or url>]
```

The TypeScript side generates its half with `pnpm run ai:params-ssot` in the cosmograph repo,
which ships the result as `ai/params-ssot.json` inside `@cosmograph/cosmograph`.
`tests/params_ssot_test.py` fails when the committed file drifts from the vendored snapshot.

### 🔄 Common Commands
| Task                | Command                      |
|---------------------|------------------------------|
| Start Jupyter Lab   | `hatch run jupyter lab`      |
| Run Tests           | `hatch run test:pytest`      |
| Lint & Format       | `ruff check cosmograph`  |
| Build Package       | `hatch build`            |
| Bump Version        | `hatch version [major\|minor\|patch\|b]` |
| Publish             | `hatch publish`          |
