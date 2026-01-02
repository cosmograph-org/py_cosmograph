"""Module for creating Cosmograph projects with uploaded data files."""

from typing import Any, Optional
import time
import requests
import json

from .config import API_BASE, logger

# Column mapping configuration: maps export config keys to API column keys
POINT_COLUMN_MAPPING = {
    "pointIdBy": "id",
    "pointLabelBy": "label",
    "pointColorBy": "color",
    "pointSizeBy": "size",
    "pointXBy": "x",
    "pointYBy": "y",
    "pointClusterBy": "cluster",
    "pointClusterStrengthBy": "cluster_strength",  # ⚠️ Needs attribute
    "pointLabelWeightBy": "label_weight",  # ⚠️ Needs attribute
    "pointTimelineBy": "time",  # Core column only - API handles automatically
}

LINK_COLUMN_MAPPING = {
    "linkSourceBy": "source",
    "linkTargetBy": "target",
    "linkColorBy": "color",
    "linkWidthBy": "width",
    "linkArrowBy": "arrow",        # ⚠️ Needs attribute
    "linkStrengthBy": "strength",  # ⚠️ Needs attribute
    "linkTimelineBy": "time",  # Core column only - API handles automatically
}

# Columns that need to be added as attributes (not core columns)
POINT_ATTRIBUTES_COLUMNS = [
    "pointClusterStrengthBy",
    "pointLabelWeightBy",
]

LINK_ATTRIBUTES_COLUMNS = [
    "linkArrowBy",
    "linkStrengthBy",
]

# Core columns that map directly to the columns object
POINT_CORE_COLUMNS = [
    "pointIdBy",
    "pointLabelBy",
    "pointColorBy",
    "pointSizeBy",
    "pointClusterBy",
    "pointXBy",
    "pointYBy",
    "pointTimelineBy",
]

LINK_CORE_COLUMNS = [
    "linkSourceBy",
    "linkTargetBy",
    "linkColorBy",
    "linkWidthBy",
    "linkTimelineBy",
]


def create_empty_project(
    api_key: str,
    project_name: str,
    description: str = "Project created via API",
    debug: bool = False,
) -> dict[str, Any]:
    """Create an empty Cosmograph project.

    Args:
        api_key: Cosmograph API key
        project_name: Name for the project
        description: Description for the project

    Returns:
        dict: API response from project creation containing project ID

    Raises:
        ValueError: If project creation fails
    """
    try:
        config_json = {
            "json": {
                "apiKey": api_key,
                "config": {
                    "title": project_name,
                    "description": description,
                },
            },
        }
        # logger.info("Creating empty project with config: %s", json.dumps(config_json, indent=4))
        start_time = time.perf_counter() if debug else None
        response = requests.post(
            f"{API_BASE}/publicApi.createProject",
            json=config_json,
        )
        response.raise_for_status()
        if debug:
            logger.info("⏱️    - createProject API request took: %.3f seconds", time.perf_counter() - start_time)

        result = response.json()
        # logger.info("✅ Empty project created successfully: %s", json.dumps(result, indent=4))
        return result
    except requests.RequestException as e:
        logger.error("❌ Failed to create empty project '%s': %s", project_name, e)
        msg = f"Failed to create empty project: {e}"
        raise ValueError(msg) from e


def create_project(
    api_key: str,
    project_name: str,
    points_data: Optional[dict[str, Any]] = None,
    links_data: Optional[dict[str, Any]] = None,
    export_config: Optional[dict[str, Any]] = None,
    debug: bool = False,
) -> dict[str, Any]:
    """Create a new Cosmograph project with the uploaded files.

    Raises:
        ValueError: If project creation fails

    Args:
        api_key: Cosmograph API key
        project_name: Name for the project
        points_data: Data for points table
        links_data: Data for links table
        export_config: Cosmograph configuration for export

    Returns:
        dict: API response from project creation

    """

    export_config = export_config or {}
    data_sources = []
    column_mapping = {
        "points": {"columns": {}},
        "links": {"columns": {}},
    }

    # Configure points data source and column mapping
    if points_data:
        data_sources.append({
            "type": "file",
            "tableName": "point_table",
            "fileName": points_data["file_name"],
        })

        # Map points columns according to API specifications
        points_columns = {}

        # Apply column mappings only for core columns
        for config_key in POINT_CORE_COLUMNS:
            value = export_config.get(config_key)
            if value:
                column_key = POINT_COLUMN_MAPPING[config_key]
                points_columns[column_key] = value

        if points_columns:
            # Build attributes array for columns that need them
            points_attributes = []
            for config_key in POINT_ATTRIBUTES_COLUMNS:
                value = export_config.get(config_key)
                if value:
                    # Create a readable label from the config key
                    label = config_key.replace("point", "").replace("By", "").replace("Weight", " Weight").replace("Strength", " Strength").strip()
                    points_attributes.append({
                        "column": value,
                        "label": label,
                        "expression": value,
                    })

            column_mapping["points"] = {
                "columns": points_columns,
                "tableName": "point_table",
            }
            if points_attributes:
                column_mapping["points"]["attributes"] = points_attributes

    # Configure links data source and column mapping
    if links_data:
        data_sources.append({
            "type": "file",
            "tableName": "link_table",
            "fileName": links_data["file_name"],
        })

        # Map links columns according to API specifications
        links_columns = {}

        # Apply column mappings only for core columns
        for config_key in LINK_CORE_COLUMNS:
            value = export_config.get(config_key)
            if value:
                column_key = LINK_COLUMN_MAPPING[config_key]
                links_columns[column_key] = value

        # Only proceed if we have at least source and target
        if "source" in links_columns and "target" in links_columns:
            # Build attributes array for columns that need them
            links_attributes = []
            for config_key in LINK_ATTRIBUTES_COLUMNS:
                value = export_config.get(config_key)
                if value:
                    # Create a readable label from the config key
                    label = config_key.replace("link", "").replace("By", "").replace("Strength", " Strength").strip()
                    links_attributes.append({
                        "column": value,
                        "label": label,
                        "expression": value,
                    })

            column_mapping["links"] = {
                "columns": links_columns,
                "tableName": "link_table",
            }
            if links_attributes:
                column_mapping["links"]["attributes"] = links_attributes

    try:
        config_json = {
            "json": {
                "apiKey": api_key,
                "config": {
                    "title": project_name,
                    "dataSources": data_sources,
                    "columnMapping": column_mapping,
                    "cosmographConfig": export_config,
                },
            },
        }
        # Create a version without API key for logging
        if debug:
            config_for_logging = {
                "json": {
                    "apiKey": "***",
                    "config": config_json["json"]["config"]
                }
            }
            logger.info("📋 Full project config being sent: %s", json.dumps(config_for_logging, indent=2))
        start_time = time.perf_counter() if debug else None
        response = requests.post(
            f"{API_BASE}/publicApi.upsertProjectByName",
            json=config_json,
        )
        response.raise_for_status()
        if debug:
            logger.info("⏱️    - upsertProjectByName API request took: %.3f seconds", time.perf_counter() - start_time)

        return response.json()
    except requests.RequestException as e:
        logger.error("❌ Failed to create project '%s': %s", project_name, e)
        msg = f"Failed to create project: {e}"
        raise ValueError(msg) from e
