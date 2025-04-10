"""Module for creating Cosmograph projects with uploaded data files."""

from typing import Any, Optional
import requests
import json

from .config import API_BASE, logger


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

  data_sources = []
  column_mapping = {
    "points": {"columns": {}},
    "links": {"columns": {}},
  }

  # Configure points data source
  if points_data:
    data_sources.append({
      "type": "file",
      "tableName": "point_table",
      "fileName": points_data["file_name"],
    })
    point_id_by = cosmograph_config.get("pointIdBy")
    if point_id_by:
      column_mapping["points"] = {
        "columns": {"id": point_id_by},
        "tableName": "point_table",
      }

  # Configure links data source
  if links_data:
    data_sources.append({
      "type": "file",
      "tableName": "link_table",
      "fileName": links_data["file_name"],
    })
    link_source_by = cosmograph_config.get("linkSourceBy")
    link_target_by = cosmograph_config.get("linkTargetBy")
    if link_source_by and link_target_by:
      column_mapping["links"] = {
        "columns": {
          "source": link_source_by,
          "target": link_target_by
        },
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
    logger.info("Config JSON: %s", json.dumps(config_json, indent=4))
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
