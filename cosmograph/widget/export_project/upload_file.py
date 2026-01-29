"""Module for handling file uploads to Cosmograph server."""
from typing import Any
import time

import requests

from .config import API_BASE, logger
from .create_project import _response_error_message


def upload_file(api_key: str, data: dict[str, Any], project_id: str, debug: bool = False) -> dict[str, Any]:
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
        start_time = time.perf_counter() if debug else None
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
        if not response.ok:
            err_body = _response_error_message(response, full=debug)
            if debug:
                msg = f"Failed to get upload URL: {response.status_code} {response.reason}. Response:\n{err_body}"
            else:
                msg = f"Failed to get upload URL: {err_body}"
            raise ValueError(msg) from None
        if debug:
            logger.info("⏱️    - Generate signed URL API request took: %.3f seconds", time.perf_counter() - start_time)
        response_json = response.json()
        try:
            upload_url = response_json["result"]["data"]["json"]["url"]
        except (KeyError, TypeError) as e:
            logger.error("❌ Unexpected response format: %s", response_json)
            msg = f"Failed to parse upload URL from response: {e}"
            raise ValueError(msg) from e
    except requests.RequestException as e:
        msg = f"Failed to get upload URL: {e}"
        if hasattr(e, "response") and e.response is not None:
            msg += f" Response: {_response_error_message(e.response, full=debug)}"
        raise ValueError(msg) from e

    try:
        start_time = time.perf_counter() if debug else None
        upload_response = requests.put(
            upload_url,
            data=data["content"],
            headers={"Content-Type": "application/parquet"}
        )
        if not upload_response.ok:
            err_body = _response_error_message(upload_response, full=debug)
            if debug:
                msg = f"Failed to upload file: {upload_response.status_code} {upload_response.reason}. Response:\n{err_body}"
            else:
                msg = f"Failed to upload file: {err_body}"
            raise ValueError(msg) from None
        logger.info("✅ File '%s' upload completed successfully", data["file_name"])
        if debug:
            upload_time = time.perf_counter() - start_time
            file_size_mb = data["content_length"] / (1024 * 1024)
            logger.info("⏱️    - File upload (%.2f MB) took: %.3f seconds", file_size_mb, upload_time)
    except requests.RequestException as e:
        msg = f"Failed to upload file: {e}"
        if hasattr(e, "response") and e.response is not None:
            msg += f" Response: {_response_error_message(e.response, full=debug)}"
        raise ValueError(msg) from e

    return {**data, "upload_url": upload_url}
