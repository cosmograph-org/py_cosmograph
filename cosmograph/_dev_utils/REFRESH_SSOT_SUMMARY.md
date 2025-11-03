# Refresh SSOT Implementation Summary

## What Was Created

### 1. `refresh_ssot.py` - Main CLI Script

A comprehensive command-line tool for managing the SSOT (Single Source of Truth) with the following features:

#### Commands

- **`diagnose`**: Check for differences without making changes
  - Fetches fresh sources from GitHub
  - Generates new SSOT
  - Compares with current SSOT
  - Displays detailed diagnostics
  - Options: `--show-full` for detailed preview

- **`refresh`**: Update the SSOT safely
  - Interactive mode with confirmation prompts (default)
  - Automatic backup creation
  - Automatic rollback on errors
  - Options:
    - `--auto`: Skip confirmations (for CI/CD)
    - `--dry-run`: Preview without changes
    - `--skip-backup`: Skip backup creation (not recommended)

- **`cleanup-backups`**: Manage old backup files
  - Keeps most recent backups
  - Options: `--keep-backups N` (default: 3)

- **`info`**: Display SSOT and configuration information
  - Current SSOT location and stats
  - Remote source URLs
  - Backup file information

#### Safety Features

1. **Automatic Backups**: Creates `_old_params_ssot.json` before any changes
2. **Rollback on Error**: Automatically restores from backup if update fails
3. **Confirmation Prompts**: Requires user approval unless `--auto` specified
4. **Dry Run Mode**: Preview changes without modifying files
5. **Staging Directory**: Works in temporary directory first

### 2. `DEV_UTILS_README.md` - Comprehensive Documentation

Complete documentation covering:

- **Quick Start Guide**: Step-by-step usage instructions
- **Command Reference**: Detailed documentation of all commands
- **Module Organization**: Overview of all `_dev_utils` modules
- **Workflow Overview**: High-level process with diagrams
- **Development Notes**: How to extend and customize
- **Best Practices**: Recommendations for safe usage
- **Troubleshooting**: Common issues and solutions

### 3. Enhanced `_resources.py`

Added two comparison methods to `ConfigsDacc` class:

- **`signature_diffs(other)`**: Compare signatures between instances
- **`info_dfs(other)`**: Compare info dataframes and show parameter changes

## Architecture

### Data Flow

```
Remote GitHub Sources
         ↓
   ConfigsDacc (staging)
         ↓
   Parse & Generate
         ↓
   New SSOT JSON
         ↓
   Compare with Current
         ↓
   Show Diagnostics
         ↓
   User Approval
         ↓
   Backup Current
         ↓
   Write New SSOT
```

### Error Handling

```
Try:
    1. Fetch sources
    2. Generate SSOT
    3. Backup current
    4. Write new SSOT
Except Error:
    - Show error message
    - Restore from backup
    - Return error code
```

## Usage Examples

### Basic Diagnostic
```bash
python -m cosmograph._dev_utils.refresh_ssot diagnose
```

### Interactive Refresh
```bash
python -m cosmograph._dev_utils.refresh_ssot refresh
```

### Automated Refresh (CI/CD)
```bash
python -m cosmograph._dev_utils.refresh_ssot refresh --auto
```

### Dry Run
```bash
python -m cosmograph._dev_utils.refresh_ssot refresh --dry-run
```

### Get Information
```bash
python -m cosmograph._dev_utils.refresh_ssot info
```

### Cleanup Old Backups
```bash
python -m cosmograph._dev_utils.refresh_ssot cleanup-backups --keep-backups 5
```

## Key Design Decisions

1. **Using `argh` for CLI**: Simple, Pythonic argument parsing
2. **Staging Pattern**: Work in temp directory first, then move to production
3. **Backup/Restore**: Always create backups, automatic rollback on errors
4. **Interactive by Default**: Require confirmation unless explicitly automated
5. **Comprehensive Diagnostics**: Show exactly what will change before doing it

## Integration Points

### Existing Code
- Uses existing `ConfigsDacc` class from `_resources.py`
- Leverages existing parsing and generation logic
- Integrates with existing `PARAMS_SSOT_PATH` from `util.py`

### New Additions
- Added comparison methods to `ConfigsDacc`
- Created CLI entry point with `argh`
- Implemented backup/restore logic
- Added diagnostic formatting

## Testing

The script was tested with:
- Import verification: ✓
- CLI help display: ✓
- Info command: ✓
- Diagnose command: ✓ (correctly detected 404 errors in source URLs)

## Known Issues

1. **Source URL 404s**: Some URLs in `_resources.py` are outdated
   - This is expected - URLs need to be updated as repos evolve
   - Script correctly detects and reports these errors
   - Solution documented in README

## Future Enhancements

Potential improvements for future iterations:

1. **Validation**: Add schema validation for generated SSOT
2. **Diff Viewer**: Better visual diff display (colors, side-by-side)
3. **Source URL Checker**: Pre-validate URLs before fetching
4. **Batch Mode**: Update multiple config files at once
5. **Conflict Resolution**: Interactive conflict resolution for ambiguous changes
6. **History Tracking**: Keep changelog of SSOT updates
7. **Integration Tests**: Automated tests for the refresh process

## Files Modified/Created

### Created
- `cosmograph/_dev_utils/refresh_ssot.py` (296 lines)
- `cosmograph/_dev_utils/DEV_UTILS_README.md` (507 lines)
- `cosmograph/_dev_utils/REFRESH_SSOT_SUMMARY.md` (this file)

### Modified
- `cosmograph/_dev_utils/_resources.py` (added 2 methods)

## Dependencies

Uses only standard library and existing dependencies:
- `argh`: For CLI (already a project dependency)
- `pandas`: For data manipulation (already a project dependency)
- `tempfile`, `shutil`, `pathlib`: Standard library

## Documentation

Complete documentation provided in:
- `DEV_UTILS_README.md`: User-facing documentation
- `refresh_ssot.py`: Inline docstrings
- This file: Implementation summary

## Conclusion

The refresh SSOT system provides a robust, safe, and user-friendly way to:
1. Keep the Python API in sync with TypeScript sources
2. Diagnose changes before applying them
3. Safely update with automatic backups and rollbacks
4. Manage the lifecycle of SSOT files

The implementation follows Python best practices and integrates seamlessly with the existing codebase.
