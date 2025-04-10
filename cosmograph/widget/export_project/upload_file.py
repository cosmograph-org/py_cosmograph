"""Module for handling file uploads to Cosmograph server."""
from typing import Any

import requests
import json

from .config import API_BASE, logger


def upload_file(api_key: str, data: dict[str, Any]) -> dict[str, Any]:
  """Generate signed URL and upload file to Cosmograph server.

  Raises:
    ValueError: If file upload or URL generation fails

  Returns:
    Dictionary containing original data with added 'upload_url' key
    containing the generated upload URL
  """

  try:
    response = requests.post(
      f"{API_BASE}/publicApi.generateSignedUploadUrl",
      json={
        "json": {
          "apiKey": api_key,
          "fileName": data["file_name"],
          "contentLength": data["content_length"],
          "contentType": "application/parquet"
        },
      },
    )
    response.raise_for_status()
    logger.info("Response: %s", json.dumps(response.json(), indent=4))
    upload_url = response.json()["result"]["data"]["json"]["url"]
  except requests.RequestException as e:
    logger.error("❌ Failed to get upload URL: %s", e)
    msg = f"Failed to get upload URL: {e}"
    raise ValueError(msg) from e

  try:
    upload_response = requests.put(
        upload_url,
        data=data["content"],
        headers={"Content-Type": "application/parquet"}
    )
    upload_response.raise_for_status()
    logger.info("✅ File '%s' upload completed successfully", data["file_name"])
  except requests.RequestException as e:
    logger.error("❌ Failed to upload file '%s': %s", data["file_name"], e)
    msg = f"Failed to upload file: {e}"
    raise ValueError(msg) from e

  return {**data, "upload_url": upload_url}
