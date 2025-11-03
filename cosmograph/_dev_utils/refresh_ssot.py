"""
Refresh the SSOT (Single Source of Truth) from remote TypeScript/JavaScript sources.

This script provides tools to:
1. Diagnose differences between current and fresh SSOT data
2. Safely refresh the SSOT files with automatic backup and rollback
3. Interactive or automatic mode for updates

Usage:
    python -m cosmograph._dev_utils.refresh_ssot diagnose
    python -m cosmograph._dev_utils.refresh_ssot refresh --auto
"""

import tempfile
import shutil
from pathlib import Path
from typing import Optional
import pandas as pd

import argh
from argh import arg

from cosmograph._dev_utils._resources import ConfigsDacc, configs_dacc
from cosmograph.util import PARAMS_SSOT_PATH


# --------------------------------------------------------------------------------------
# Core functionality


def _create_staging_dacc() -> ConfigsDacc:
    """Create a staging ConfigsDacc instance in a temporary directory."""
    staging_dir = tempfile.mkdtemp(prefix="cosmograph_ssot_staging_")
    print(f"📁 Created staging directory: {staging_dir}")
    return ConfigsDacc(config_files_dir=staging_dir)


def _fetch_fresh_sources(stage: ConfigsDacc) -> None:
    """Fetch fresh sources from remote repositories."""
    print("🌐 Fetching sources from remote repositories...")
    _ = stage.source_strings  # This triggers fetching and caching
    print("✓ Sources fetched successfully")


def _generate_new_ssot(stage: ConfigsDacc) -> str:
    """Generate new SSOT JSON content."""
    print("⚙️  Generating new SSOT...")
    new_params_ssot_json = stage.cosmograph_base_params_json()
    print("✓ SSOT generated successfully")
    return new_params_ssot_json


def _print_diagnostics(current: ConfigsDacc, stage: ConfigsDacc) -> None:
    """Print diagnostic information comparing current and staged SSOT."""
    print("\n" + "=" * 80)
    print("DIAGNOSTICS: Current vs. Staged SSOT")
    print("=" * 80)

    # Signature differences
    print("\n📊 Signature Differences:")
    print("-" * 80)
    try:
        sig_diffs = current.signature_diffs(stage)
        if sig_diffs:
            for key, value in sig_diffs.items():
                print(f"\n{key}:")
                if isinstance(value, pd.DataFrame):
                    print(value.to_string())
                elif isinstance(value, dict):
                    for k, v in value.items():
                        print(f"  {k}: {v}")
                else:
                    print(f"  {value}")
        else:
            print("  ✓ No signature differences detected")
    except AttributeError:
        print("  ℹ️  Signature comparison not available")

    # Info DataFrames comparison
    print("\n📋 Info DataFrames Comparison:")
    print("-" * 80)
    try:
        info_comparison = current.info_dfs(stage)
        if info_comparison:
            print(info_comparison)
        else:
            print("  ✓ No differences in info DataFrames")
    except AttributeError:
        print("  ℹ️  Info DataFrames comparison not available")

    # Matched info comparison
    print("\n🔍 Matched Info Comparison:")
    print("-" * 80)
    try:
        current_df = current.matched_info_df
        staged_df = stage.matched_info_df

        # Compare shapes
        print(f"  Current SSOT parameters: {len(current_df)}")
        print(f"  Staged SSOT parameters: {len(staged_df)}")

        # Parameters added/removed
        current_params = set(current_df.index)
        staged_params = set(staged_df.index)

        added = staged_params - current_params
        removed = current_params - staged_params

        if added:
            print(f"\n  ➕ Parameters added ({len(added)}):")
            for param in sorted(added):
                print(f"     - {param}")

        if removed:
            print(f"\n  ➖ Parameters removed ({len(removed)}):")
            for param in sorted(removed):
                print(f"     - {param}")

        if not added and not removed:
            print("  ✓ No parameters added or removed")

    except Exception as e:
        print(f"  ⚠️  Could not compare matched info: {e}")

    print("\n" + "=" * 80)


def _backup_file(file_path: Path) -> Path:
    """
    Backup a file by renaming it with _old_ prefix.
    Returns the backup path.
    """
    if not file_path.exists():
        return None

    backup_path = file_path.parent / f"_old_{file_path.name}"
    counter = 1
    while backup_path.exists():
        backup_path = file_path.parent / f"_old_{counter}_{file_path.name}"
        counter += 1

    shutil.copy2(file_path, backup_path)
    print(f"💾 Backed up: {file_path.name} → {backup_path.name}")
    return backup_path


def _restore_backup(backup_path: Path, original_path: Path) -> None:
    """Restore a file from backup."""
    if backup_path and backup_path.exists():
        shutil.copy2(backup_path, original_path)
        print(f"↩️  Restored from backup: {backup_path.name} → {original_path.name}")


def _confirm(prompt: str) -> bool:
    """Ask user for confirmation."""
    response = input(f"{prompt} [y/N]: ").strip().lower()
    return response in ("y", "yes")


# --------------------------------------------------------------------------------------
# CLI Commands


@arg("--show-full", help="Show full diagnostic details")
def diagnose(show_full: bool = False):
    """
    Diagnose differences between current and fresh SSOT without making changes.

    This will:
    1. Fetch fresh sources from remote repositories
    2. Generate a new SSOT
    3. Compare it with the current SSOT
    4. Display diagnostic information
    """
    print("🔍 SSOT Diagnosis Mode")
    print("=" * 80)

    try:
        # Create staging instance
        stage = _create_staging_dacc()

        # Fetch fresh sources
        _fetch_fresh_sources(stage)

        # Generate new SSOT
        new_ssot = _generate_new_ssot(stage)

        # Print diagnostics
        _print_diagnostics(configs_dacc, stage)

        if show_full:
            print("\n📄 Preview of new SSOT (first 1000 chars):")
            print("-" * 80)
            print(new_ssot[:1000])
            print("..." if len(new_ssot) > 1000 else "")

        print("\n✅ Diagnosis complete. No files were modified.")

    except Exception as e:
        print(f"\n❌ Error during diagnosis: {e}")
        import traceback

        traceback.print_exc()
        return 1

    return 0


@arg("--auto", help="Automatically proceed without confirmation prompts")
@arg(
    "--skip-backup",
    help="Skip creating backup files (not recommended unless you have version control)",
)
@arg("--dry-run", help="Show what would be done without actually doing it")
def refresh(auto: bool = False, skip_backup: bool = False, dry_run: bool = False):
    """
    Refresh the SSOT from remote sources.

    This will:
    1. Fetch fresh sources from remote repositories
    2. Generate a new SSOT
    3. Show diagnostics
    4. Ask for confirmation (unless --auto is specified)
    5. Backup the current SSOT file (unless --skip-backup is specified)
    6. Write the new SSOT
    7. Restore from backup if anything goes wrong

    Use --auto to skip confirmation prompts (useful for CI/CD).
    Use --skip-backup to skip creating backup files (only if you trust your VCS).
    Use --dry-run to see what would happen without making changes.
    """
    mode = "🔄 SSOT Refresh Mode"
    if dry_run:
        mode += " (DRY RUN)"
    if auto:
        mode += " (AUTOMATIC)"

    print(mode)
    print("=" * 80)

    backup_path = None

    try:
        # Create staging instance
        stage = _create_staging_dacc()

        # Fetch fresh sources
        _fetch_fresh_sources(stage)

        # Generate new SSOT
        new_ssot = _generate_new_ssot(stage)

        # Print diagnostics
        _print_diagnostics(configs_dacc, stage)

        # Ask for confirmation if not in auto mode
        if not auto and not dry_run:
            print("\n" + "=" * 80)
            if not _confirm("Do you want to proceed with updating the SSOT?"):
                print("❌ Update cancelled by user.")
                return 1

        if dry_run:
            print("\n✅ Dry run complete. No files were modified.")
            print(f"   Would update: {PARAMS_SSOT_PATH}")
            return 0

        # Backup current SSOT
        if not skip_backup:
            backup_path = _backup_file(PARAMS_SSOT_PATH)

        # Write new SSOT
        print(f"\n📝 Writing new SSOT to: {PARAMS_SSOT_PATH}")
        PARAMS_SSOT_PATH.write_text(new_ssot)
        print("✓ SSOT updated successfully!")

        # Clean up staging directory
        staging_dir = Path(stage.config_files_dir)
        if staging_dir.exists():
            shutil.rmtree(staging_dir)
            print(f"🧹 Cleaned up staging directory")

        print("\n✅ SSOT refresh complete!")

        if backup_path:
            print(f"\n💡 Backup saved at: {backup_path}")
            print("   You can safely delete it once you've verified the changes.")

        return 0

    except Exception as e:
        print(f"\n❌ Error during refresh: {e}")
        import traceback

        traceback.print_exc()

        # Restore from backup if available
        if backup_path and not dry_run:
            print("\n⚠️  Attempting to restore from backup...")
            try:
                _restore_backup(backup_path, PARAMS_SSOT_PATH)
                print("✓ Successfully restored from backup")
            except Exception as restore_error:
                print(f"❌ Failed to restore from backup: {restore_error}")
                print(f"   Manual restoration required from: {backup_path}")

        return 1


@arg("--keep-backups", help="Number of recent backups to keep (default: 3)")
def cleanup_backups(keep_backups: int = 3):
    """
    Clean up old backup files, keeping only the most recent ones.

    By default, keeps the 3 most recent backups.
    """
    print(f"🧹 Cleaning up old SSOT backups (keeping {keep_backups} most recent)...")

    backup_dir = PARAMS_SSOT_PATH.parent
    backup_pattern = "_old_*_params_ssot.json"

    # Find all backup files
    backups = sorted(backup_dir.glob(backup_pattern), key=lambda p: p.stat().st_mtime)

    if not backups:
        print("✓ No backup files found")
        return 0

    print(f"   Found {len(backups)} backup file(s)")

    # Keep only the most recent ones
    to_delete = backups[:-keep_backups] if len(backups) > keep_backups else []

    if not to_delete:
        print(f"✓ All backups are within the keep limit ({keep_backups})")
        return 0

    for backup in to_delete:
        try:
            backup.unlink()
            print(f"   Deleted: {backup.name}")
        except Exception as e:
            print(f"   ⚠️  Could not delete {backup.name}: {e}")

    print(f"✅ Cleanup complete. Kept {min(len(backups), keep_backups)} backup(s).")
    return 0


def info():
    """
    Display information about the current SSOT and configuration.
    """
    print("ℹ️  SSOT Information")
    print("=" * 80)

    # Current SSOT location
    print(f"\n📁 SSOT File Location:")
    print(f"   {PARAMS_SSOT_PATH}")
    print(f"   Exists: {PARAMS_SSOT_PATH.exists()}")

    if PARAMS_SSOT_PATH.exists():
        file_size = PARAMS_SSOT_PATH.stat().st_size
        print(f"   Size: {file_size:,} bytes")

        # Load and show basic stats
        try:
            import json

            params = json.loads(PARAMS_SSOT_PATH.read_text())
            print(f"   Parameters: {len(params)}")

            # Show first few parameter names
            param_names = [p["name"] for p in params[:5]]
            print(
                f"   First params: {', '.join(param_names)}"
                + ("..." if len(params) > 5 else "")
            )

        except Exception as e:
            print(f"   ⚠️  Could not parse SSOT: {e}")

    # Source URLs
    from cosmograph._dev_utils._resources import source_urls

    print(f"\n🌐 Remote Source URLs ({len(source_urls)}):")
    for name, url in list(source_urls.items())[:3]:
        print(f"   • {name}")
        print(f"     {url}")
    if len(source_urls) > 3:
        print(f"   ... and {len(source_urls) - 3} more")

    # Config directory
    print(f"\n📂 Config Directory:")
    print(f"   {configs_dacc.config_files_dir}")

    # Backups
    backup_dir = PARAMS_SSOT_PATH.parent
    backups = list(backup_dir.glob("_old_*_params_ssot.json"))
    print(f"\n💾 Backup Files: {len(backups)}")
    for backup in backups[-3:]:
        size = backup.stat().st_size
        print(f"   • {backup.name} ({size:,} bytes)")
    if len(backups) > 3:
        print(f"   ... and {len(backups) - 3} more")

    print("\n" + "=" * 80)
    return 0


# --------------------------------------------------------------------------------------
# Main CLI dispatcher


def main():
    """Main entry point for the CLI."""
    parser = argh.ArghParser(description=__doc__)
    parser.add_commands([diagnose, refresh, cleanup_backups, info])
    parser.dispatch()


if __name__ == "__main__":
    main()
