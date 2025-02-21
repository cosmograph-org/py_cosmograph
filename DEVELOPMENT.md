# 🧑‍🚀 Cosmograph Widget Development Guide

🤖 **Tech Stack:** Python 3.10+, JavaScript (ES6), Anywidget, Hatch, Ruff

```text
py_cosmograph/
├── js/              # Source JavaScript
├── src/             # Python package source
│   └── cosmograph/
│       └── widget/
|           └── __init__.py
│       └── __about__.py # <- cosmograph version here
│       └── __init__.py
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

### 🔄 Common Commands
| Task                | Command                      |
|---------------------|------------------------------|
| Start Jupyter Lab   | `hatch run jupyter lab`      |
| Run Tests           | `hatch run test:pytest`      |
| Lint & Format       | `ruff check src/cosmograph`  |
| Build Package       | `hatch run build`            |
| Bump Version        | `hatch version [major\|minor\|patch\|b]` |
| Publish             | `hatch run publish`          |
