"""
Utils for traitlets
"""

# Note: Vendorized from ju package. Please keep them synchronized.
# Consider adding ju as dependency.

import traitlets
from traitlets import TraitType
import typing
from typing import Union, Type, Any, Callable, Dict

import enum
import re
import collections.abc

ObserveHandlerPyType = Callable[[Dict[str, Any]], Any]

# Mapping from traitlets types to Python types (as defined previously)
py_type_for_traitlet_type = {
    # C* types before their base types
    traitlets.CBool: bool,
    traitlets.Bool: bool,
    traitlets.CBytes: bytes,
    traitlets.Bytes: bytes,
    traitlets.CComplex: complex,
    traitlets.Complex: complex,
    traitlets.CFloat: float,
    traitlets.Float: float,
    traitlets.CInt: int,
    traitlets.Int: int,
    traitlets.CUnicode: str,
    traitlets.Unicode: str,
    traitlets.CRegExp: re.Pattern,
    traitlets.DottedObjectName: str,
    traitlets.ObjectName: str,
    traitlets.CaselessStrEnum: str,
    traitlets.FuzzyEnum: str,
    traitlets.Enum: enum.Enum,
    traitlets.TCPAddress: tuple,
    # Container types and their subclasses
    traitlets.List: list,
    traitlets.Set: set,
    traitlets.Tuple: tuple,
    traitlets.Container: collections.abc.Container,
    traitlets.Dict: dict,
    # Class and instance types
    traitlets.ForwardDeclaredInstance: object,
    traitlets.Instance: object,
    traitlets.ForwardDeclaredType: type,
    traitlets.Type: type,
    traitlets.This: type,
    traitlets.ClassBasedTraitType: type,
    # Other types
    traitlets.Callable: collections.abc.Callable,
    traitlets.ObserveHandler: ObserveHandlerPyType,
    traitlets.UseEnum: enum.Enum,
    traitlets.Union: typing.Union,
    traitlets.Any: object,
    traitlets.TraitType: object,
}


def trait_to_py(trait: Union[TraitType, Type[TraitType]]) -> Union[object, type]:
    """
    Convert a traitlets trait (instance or type) to a Python object (instance or type)

    >>> trait_to_py(traitlets.Bool())
    <class 'bool'>
    >>> trait_to_py(traitlets.Union([traitlets.Unicode(), traitlets.Float()]))
    typing.Union[str, float]

    """
    if isinstance(trait, type):
        # Trait is a type (class), map it directly
        if trait in py_type_for_traitlet_type:
            py_type = py_type_for_traitlet_type[trait]
            return py_type
        else:
            raise ValueError(f"Unknown traitlet type: {trait}")
    else:
        # Trait is an instance
        trait_type = type(trait)
        if trait_type is traitlets.Instance:
            # For Instance traits, return the class if available
            if isinstance(trait.klass, type):
                return trait.klass
            else:
                return typing.Any
        elif trait_type is traitlets.UseEnum:
            # For UseEnum traits, return the enum class
            if hasattr(trait, 'enum_class'):
                return trait.enum_class
            else:
                return enum.Enum
        elif trait_type is traitlets.Type:
            # For Type traits, return Type[class]
            if isinstance(trait.klass, type):
                return typing.Type[trait.klass]
            else:
                return typing.Type[typing.Any]
        else:
            # Get the base Python type
            py_type = trait_to_py(trait_type)
            # Extract type parameters if any
            args = extract_type_params(trait_type, trait)
            if args:
                # For typing generics, apply the type parameters
                return py_type[args]
            else:
                return py_type


def extract_type_params(trait_type, trait):
    """
    Extract type parameters for a trait.

    >>> extract_type_params(
    ...     traitlets.Union, traitlets.Union([traitlets.Unicode(), traitlets.Float()])
    ... )
    (<class 'str'>, <class 'float'>)

    """
    if trait_type is traitlets.Union:
        # For Union traits, get the types of the inner traits
        return tuple(trait_to_py(t) for t in trait.trait_types)
    elif trait_type is traitlets.List:
        # For List traits, get the element type
        if trait._trait:
            return (trait_to_py(trait._trait),)
        else:
            return (typing.Any,)
    elif trait_type is traitlets.Tuple:
        # For Tuple traits, get the types of the elements
        if trait._traits:
            return tuple(trait_to_py(t) for t in trait._traits)
        else:
            return (typing.Any, ...)
    elif trait_type is traitlets.Set:
        # For Set traits, get the element type
        if trait._trait:
            return (trait_to_py(trait._trait),)
        else:
            return (typing.Any,)
    elif trait_type is traitlets.Dict:
        # For Dict traits, get the key and value types
        key_type = trait_to_py(trait._key_trait) if trait._key_trait else typing.Any
        value_type = (
            trait_to_py(trait._value_trait) if trait._value_trait else typing.Any
        )
        return (key_type, value_type)
    else:
        # For other types, no type parameters
        return None
