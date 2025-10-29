"""Module for Cosmograph project export functionality."""

from typing import Any, Optional
import time

import pandas as pd
import json

from .prepare_parquet import prepare_parquet_data
from .upload_file import upload_file
from .create_project import create_project, create_empty_project
from .config import logger


def export_project(
    api_key: Optional[str] = None,
    project_name: str = "Cosmograph Project",
    points: Optional[pd.DataFrame] = None,
    links: Optional[pd.DataFrame] = None,
    export_config: Optional[dict[str, Any]] = None,
    debug: bool = False,
) -> dict[str, Any]:
    """Export data to a Cosmograph project.

    Args:
        api_key: Cosmograph API key
        project_name: Name for the project
        points: DataFrame containing point data
        links: DataFrame containing link data
        export_config: Cosmograph configuration for export (column mappings and visual settings)
        debug: If True, show detailed timing and configuration logs (default: False)

    Returns:
        Dict containing the project ID

    Raises:
        ValueError: If no API key is provided.

    """  # noqa: E117
    if not api_key:
        error_msg = "No API key provided. Please set an API key using set_api_key() or pass it directly to the Cosmograph constructor."
        logger.error("❌ %s", error_msg)
        raise ValueError(error_msg)

    start_time = time.perf_counter() if debug else None
    logger.info("🚀 Exporting project: %s (%s points, %s links)",
        project_name,
        len(points) if points is not None else 0,
        len(links) if links is not None else 0)

    if debug and export_config:
        logger.info("📋 Export config: %s", json.dumps(export_config, indent=2))

    # Step 1: Create empty project first
    try:
        step_start = time.perf_counter() if debug else None
        project_result = create_empty_project(api_key, project_name, debug=debug)
        project_id = project_result["result"]["data"]["json"]["id"]
        if debug:
            logger.info("⏱️  Create empty project took: %.3f seconds", time.perf_counter() - step_start)
    except Exception as e:
        logger.error("❌ Failed to create empty project: %s", e)
        raise ValueError(f"Failed to create empty project: {e}") from e

    # Step 2: Upload files with project ID
    points_data = None
    links_data = None
    if points is not None and not points.empty:
        try:
            if debug:
                logger.info("📊 Points data columns: %s", list(points.columns))
                logger.info("📊 Points data shape: %s rows × %s columns", points.shape[0], points.shape[1])
            step_start = time.perf_counter() if debug else None
            points_data = prepare_parquet_data(points, f"{project_name}_points.parquet")
            if debug:
                prep_time = time.perf_counter() - step_start
                logger.info("⏱️  Prepare points parquet took: %.3f seconds", prep_time)

            step_start = time.perf_counter() if debug else None
            points_data = upload_file(api_key, points_data, project_id, debug=debug)
            if debug:
                logger.info("⏱️  Upload points file took: %.3f seconds", time.perf_counter() - step_start)
        except Exception as e:
            logger.error("❌ Failed to upload points data: %s", e)
            raise ValueError(f"Failed to process points data: {e}") from e

    if links is not None and not links.empty:
        try:
            if debug:
                logger.info("📊 Links data columns: %s", list(links.columns))
                logger.info("📊 Links data shape: %s rows × %s columns", links.shape[0], links.shape[1])
            step_start = time.perf_counter() if debug else None
            links_data = prepare_parquet_data(links, f"{project_name}_links.parquet")
            if debug:
                prep_time = time.perf_counter() - step_start
                logger.info("⏱️  Prepare links parquet took: %.3f seconds", prep_time)

            step_start = time.perf_counter() if debug else None
            links_data = upload_file(api_key, links_data, project_id, debug=debug)
            if debug:
                logger.info("⏱️  Upload links file took: %.3f seconds", time.perf_counter() - step_start)
        except Exception as e:
            logger.error("❌ Failed to upload links data: %s", e)
            raise ValueError(f"Failed to process links data: {e}") from e

    # Step 3: Update project with uploaded files and configuration
    if points_data or links_data or export_config:
        try:
            step_start = time.perf_counter() if debug else None
            create_project(
                api_key=api_key,
                project_name=project_name,
                points_data=points_data,
                links_data=links_data,
                export_config=export_config,
                debug=debug,
            )
            if debug:
                logger.info("⏱️  Update project took: %.3f seconds", time.perf_counter() - step_start)
            # logger.info("Result: %s", json.dumps(result, indent=4))
        except Exception as e:
            logger.error("❌ Failed to update project: %s", e)
            raise ValueError(f"Failed to update project: {e}") from e

    project_url = f"https://run.cosmograph.app/project/{project_id}"
    logger.info("✅ Project ready: %s", project_url)
    if debug:
        total_time = time.perf_counter() - start_time
        logger.info("⏱️  Total export time: %.3f seconds", total_time)

    return project_id
