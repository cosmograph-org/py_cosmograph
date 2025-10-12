"""Screenshot functionality for Cosmograph widgets."""

from typing import Optional
import base64
import io

try:
    from PIL import Image
except ImportError:
    Image = None


def take_pic_js(widget):
    """
    Capture a screenshot of the Cosmograph widget and return it as a PIL Image.

    This function triggers the JavaScript screenshot capture functionality
    and converts the resulting data URL to a PIL Image.

    Args:
        widget: A Cosmograph widget instance

    Returns:
        PIL Image object if successful, None if failed

    Raises:
        ImportError: If PIL is not available
        ValueError: If screenshot capture fails or returns invalid data
    """
    if Image is None:
        raise ImportError(
            "PIL (Pillow) is required for screenshot functionality. Install with: pip install Pillow"
        )

    if not hasattr(widget, 'capture_screenshot_data'):
        raise ValueError("Widget does not support screenshot functionality")

    # Clear any previous data
    widget.screenshot_data = None

    # Trigger the JavaScript screenshot capture
    widget.capture_screenshot_data()

    # Wait a moment for the JavaScript to respond
    import time

    time.sleep(0.5)

    # Get the result
    data = widget.screenshot_data

    if not data:
        return None

    if isinstance(data, str) and data.startswith('error:'):
        raise ValueError(f"Screenshot capture failed: {data}")

    if not isinstance(data, str) or not data.startswith('data:image'):
        raise ValueError(f"Invalid screenshot data received: {type(data)}")

    try:
        # Extract the base64 data from the data URL
        header, encoded_data = data.split(',', 1)
        image_data = base64.b64decode(encoded_data)

        # Create PIL Image from the data
        image = Image.open(io.BytesIO(image_data))
        return image

    except Exception as e:
        raise ValueError(f"Failed to convert screenshot data to PIL Image: {e}")


def take_pic_js_async(widget, timeout: float = 5.0):
    """
    Async version of take_pic_js with configurable timeout.

    Args:
        widget: A Cosmograph widget instance
        timeout: Maximum time to wait for screenshot (seconds)

    Returns:
        PIL Image object if successful, None if failed or timed out
    """
    if Image is None:
        raise ImportError(
            "PIL (Pillow) is required for screenshot functionality. Install with: pip install Pillow"
        )

    import time

    # Clear any previous data
    widget.screenshot_data = None

    # Trigger the capture
    widget.capture_screenshot_data()

    # Poll for result with timeout
    start_time = time.time()
    while time.time() - start_time < timeout:
        data = widget.screenshot_data

        if data:
            if isinstance(data, str) and data.startswith('error:'):
                raise ValueError(f"Screenshot capture failed: {data}")

            if isinstance(data, str) and data.startswith('data:image'):
                try:
                    header, encoded_data = data.split(',', 1)
                    image_data = base64.b64decode(encoded_data)
                    image = Image.open(io.BytesIO(image_data))
                    return image
                except Exception as e:
                    raise ValueError(f"Failed to convert screenshot data: {e}")

        time.sleep(0.1)  # Check every 100ms

    # Timeout reached
    return None
