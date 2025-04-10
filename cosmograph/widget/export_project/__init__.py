"""Module for Cosmograph project export functionality."""

from typing import Any, Optional

import pandas as pd
import json

from .prepare_parquet import prepare_parquet_data
from .upload_file import upload_file
from .create_project import create_project
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

  Returns:
    Dict containing the API response from project creation

  """
  if not api_key:
    error_msg = "No API key provided. Please set an API key using set_api_key() or pass it directly to the Cosmograph constructor."
    logger.error("❌ %s", error_msg)
    return None# raise ValueError(error_msg)

  logger.info("🚀 Starting export process for project: %s", project_name)
  logger.info("📊 Data summary: %s points and %s links to be exported",
    len(points) if points is not None else 0,
    len(links) if links is not None else 0)

  # Convert dataframes to parquet
  points_data = None
  links_data = None
  if points is not None and not points.empty:
    logger.info("📦 Converting points data to parquet format...")
    points_data = prepare_parquet_data(points, f"{project_name}_points.parquet")
    points_data = upload_file(api_key, points_data)

  if links is not None and not links.empty:
    logger.info("📦 Converting links data to parquet format...")
    links_data = prepare_parquet_data(links, f"{project_name}_links.parquet")
    links_data = upload_file(api_key, links_data)

  # Create project with uploaded files
  logger.info("🔨 Creating project '%s' with uploaded files...", project_name)
  result = create_project(
    api_key=api_key,
    project_name=project_name,
    points_data=points_data,
    links_data=links_data,
    cosmograph_config=cosmograph_config,
  )
  logger.info("Result: %s", json.dumps(result, indent=4))
  logger.info("🎉 Project export completed successfully! Project ID: %s",
    result.get("result", {}).get("data", {}).get("json", {}).get("id", "unknown"))

  return result
