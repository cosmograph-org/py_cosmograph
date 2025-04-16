"""Configuration settings for cosmograph."""

# Global API key variable
_GLOBAL_API_KEY = None
_COSMOGRAPH_INSTANCES = set()


def set_api_key(api_key: str) -> None:
    """
    Set a global API key to be used by all cosmograph instances.

    Args:
        api_key: The API key to use
    """
    global _GLOBAL_API_KEY
    _GLOBAL_API_KEY = api_key

    # Update API key for all existing instances
    for instance in _COSMOGRAPH_INSTANCES:
        instance.api_key = api_key


def get_api_key() -> str:
    """
    Get the current global API key.

    Returns:
        The current global API key, or None if not set
    """
    return _GLOBAL_API_KEY


def register_instance(instance) -> None:
    """
    Register a cosmograph instance to receive API key updates.

    Args:
        instance: A Cosmograph instance
    """
    _COSMOGRAPH_INSTANCES.add(instance)


def unregister_instance(instance) -> None:
    """
    Unregister a cosmograph instance.

    Args:
        instance: A Cosmograph instance
    """
    if instance in _COSMOGRAPH_INSTANCES:
        _COSMOGRAPH_INSTANCES.remove(instance)
