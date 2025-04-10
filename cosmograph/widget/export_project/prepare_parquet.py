"""Module for converting pandas DataFrames to Parquet format for Cosmograph uploads."""
from io import BytesIO
from typing import Any

import pandas as pd


def prepare_parquet_data(df: pd.DataFrame, filename: str) -> dict[str, Any]:
    """Convert DataFrame to Parquet format and prepare upload data.

    Args:
        df: Input DataFrame to convert
        filename: Name for the output file

    Returns:
        Dictionary containing file metadata and content:
        - file_name: Output filename
        - content: Parquet bytes content
        - content_length: Byte length of content

    """
    buffer = BytesIO()
    df.to_parquet(buffer)
    buffer.seek(0)
    content = buffer.read()
    content_length = len(content)

    return {
        "file_name": filename,
        "content": content,
        "content_length": content_length,
    }
