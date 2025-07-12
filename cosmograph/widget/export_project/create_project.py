"""Module for creating Cosmograph projects with uploaded data files."""

from typing import Any, Optional
import requests
import json

from .config import API_BASE, logger


def create_empty_project(
    api_key: str,
    project_name: str,
    description: str = "Project created via API",
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
        response = requests.post(
            f"{API_BASE}/publicApi.createProject",
            json=config_json,
        )
        response.raise_for_status()

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
    cosmograph_config: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Create a new Cosmograph project with the uploaded files.

    Raises:
        ValueError: If project creation fails

    Args:
        api_key: Cosmograph API key
        project_name: Name for the project
        points_data: Data for points table
        links_data: Data for links table
        cosmograph_config: Cosmograph config

    Returns:
        dict: API response from project creation

    """

    cosmograph_config = cosmograph_config or {}
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

        # Required columns
        point_id_by = cosmograph_config.get("pointIdBy")
        if point_id_by:
            points_columns["id"] = point_id_by

        # Optional columns - map only if present in config
        point_label_by = cosmograph_config.get("pointLabelBy")
        if point_label_by:
            points_columns["label"] = point_label_by

        point_color_by = cosmograph_config.get("pointColorBy")
        if point_color_by:
            points_columns["color"] = point_color_by

        point_size_by = cosmograph_config.get("pointSizeBy")
        if point_size_by:
            points_columns["size"] = point_size_by

        point_x_by = cosmograph_config.get("pointXBy")
        if point_x_by:
            points_columns["x"] = point_x_by

        point_y_by = cosmograph_config.get("pointYBy")
        if point_y_by:
            points_columns["y"] = point_y_by

        point_cluster_by = cosmograph_config.get("pointClusterBy")
        if point_cluster_by:
            points_columns["cluster"] = point_cluster_by

        point_timeline_by = cosmograph_config.get("pointTimelineBy")
        if point_timeline_by:
            points_columns["time"] = point_timeline_by

        if points_columns:
            column_mapping["points"] = {
                "columns": points_columns,
                "tableName": "point_table",
            }

    # Configure links data source and column mapping
    if links_data:
        data_sources.append({
            "type": "file",
            "tableName": "link_table",
            "fileName": links_data["file_name"],
        })

        # Map links columns according to API specifications
        links_columns = {}

        # Required columns
        link_source_by = cosmograph_config.get("linkSourceBy")
        link_target_by = cosmograph_config.get("linkTargetBy")
        if link_source_by and link_target_by:
            links_columns["source"] = link_source_by
            links_columns["target"] = link_target_by

            # Optional columns - map only if present in config
            link_width_by = cosmograph_config.get("linkWidthBy")
            if link_width_by:
                links_columns["width"] = link_width_by

            link_color_by = cosmograph_config.get("linkColorBy")
            if link_color_by:
                links_columns["color"] = link_color_by

            # Note: Link time mapping could be added here if supported in the future
            # link_timeline_by = cosmograph_config.get("linkTimelineBy")
            # if link_timeline_by:
            #   links_columns["time"] = link_timeline_by

            column_mapping["links"] = {
                "columns": links_columns,
                "tableName": "link_table",
            }

    try:
        config_json = {
            "json": {
                "apiKey": api_key,
                "config": {
                    "title": project_name,
                    "dataSources": data_sources,
                    "columnMapping": column_mapping,
                    "cosmographConfig": cosmograph_config,
                },
            },
        }
        # logger.info("Config JSON: %s", json.dumps(config_json, indent=4))
        response = requests.post(
            f"{API_BASE}/publicApi.upsertProjectByName",
            json=config_json,
        )
        response.raise_for_status()

        return response.json()
    except requests.RequestException as e:
        logger.error("❌ Failed to create project '%s': %s", project_name, e)
        msg = f"Failed to create project: {e}"
        raise ValueError(msg) from e
