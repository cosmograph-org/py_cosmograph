"""Module for handling file uploads to Cosmograph server."""
from typing import Any

import requests
import json

from .config import API_BASE, logger


def upload_file(api_key: str, data: dict[str, Any], project_id: str) -> dict[str, Any]:
    """Generate signed URL and upload file to Cosmograph server.

    Args:
        api_key: Cosmograph API key
        data: Dictionary containing file data (file_name, content_length, content)
        project_id: Project ID to associate the file with

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
                    "projectId": project_id,
                    "fileName": data["file_name"],
                    "contentLength": data["content_length"],
                    "contentType": "application/parquet"
                },
            },
        )
        response.raise_for_status()
        # logger.info("Response: %s", json.dumps(response.json(), indent=4))
        response_json = response.json()
        try:
            upload_url = response_json["result"]["data"]["json"]["url"]
        except (KeyError, TypeError) as e:
            logger.error("❌ Unexpected response format: %s", response_json)
            msg = f"Failed to parse upload URL from response: {e}"
            raise ValueError(msg) from e
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
