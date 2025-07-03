"""Module for Cosmograph project export functionality."""

from typing import Any, Optional

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
  cosmograph_config: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
  """Export data to a Cosmograph project.

  Args:
    api_key: Cosmograph API key
    project_name: Name for the project
    points: DataFrame containing point data
    links: DataFrame containing link data
    cosmograph_config: Cosmograph configuration

  Returns:
    Dict containing the project ID

  Raises:
    ValueError: If no API key is provided.

  """
  if not api_key:
    error_msg = "No API key provided. Please set an API key using set_api_key() or pass it directly to the Cosmograph constructor."
    logger.error("❌ %s", error_msg)
    raise ValueError(error_msg)

  logger.info("🚀 Starting export process for project: %s", project_name)
  logger.info("📊 Data summary: %s points and %s links to be exported",
    len(points) if points is not None else 0,
    len(links) if links is not None else 0)

  # Step 1: Create empty project first
  logger.info("🔨 Creating empty project '%s'...", project_name)
  try:
    project_result = create_empty_project(api_key, project_name)
    project_id = project_result["result"]["data"]["json"]["id"]
    logger.info("✅ Empty project created with ID: %s", project_id)
  except Exception as e:
    logger.error("❌ Failed to create empty project: %s", e)
    raise ValueError(f"Failed to create empty project: {e}") from e

  # Step 2: Upload files with project ID
  points_data = None
  links_data = None
  if points is not None and not points.empty:
    logger.info("📦 Converting points data to parquet format...")
    try:
      points_data = prepare_parquet_data(points, f"{project_name}_points.parquet")
      points_data = upload_file(api_key, points_data, project_id)
    except Exception as e:
      logger.error("❌ Failed to upload points data: %s", e)
      raise ValueError(f"Failed to process points data: {e}") from e

  if links is not None and not links.empty:
    logger.info("📦 Converting links data to parquet format...")
    try:
      links_data = prepare_parquet_data(links, f"{project_name}_links.parquet")
      links_data = upload_file(api_key, links_data, project_id)
    except Exception as e:
      logger.error("❌ Failed to upload links data: %s", e)
      raise ValueError(f"Failed to process links data: {e}") from e

  # Step 3: Update project with uploaded files and configuration
  if points_data or links_data or cosmograph_config:
    logger.info("🔧 Updating project with uploaded files and configuration...")
    try:
      result = create_project(
        api_key=api_key,
        project_name=project_name,
        points_data=points_data,
        links_data=links_data,
        cosmograph_config=cosmograph_config,
      )
      # logger.info("Result: %s", json.dumps(result, indent=4))
    except Exception as e:
      logger.error("❌ Failed to update project: %s", e)
      raise ValueError(f"Failed to update project: {e}") from e

  logger.info("🎉 Project export completed successfully! Project ID: %s", project_id)

  return project_id
