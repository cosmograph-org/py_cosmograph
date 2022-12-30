"""Utils to bridge with JS"""

import os
from typing import Any
from pathlib import Path
from functools import partial
from itertools import chain

from dol.signatures import Sig
import esprima

AstScript = esprima.nodes.Script
AstNode = esprima.nodes.Node


# TODO: Parse out js docs and add them to py mirror function


def parse_js_code(js_code: str, encoding: str | None = None) -> AstScript:
    if os.path.isfile(js_code):
        js_code = Path(js_code).read_text(encoding=encoding)
    return esprima.parse(js_code)


def _extract_params(x: AstNode):
    if x.type == 'Identifier':
        return dict(name=x.name)
    elif x.type == 'AssignmentPattern':
        return dict(name=x.left.name, default=x.right.value)
    else:
        raise ValueError(f'Unknown param type: {x.type=}')


def _extract_name_from_assignment_expression(x: AstNode):
    if x.left.type == 'Identifier':
        return x.left.name
    elif x.left.type == 'MemberExpression':
        return f'{x.left.object.name}.{x.left.property.name}'
    else:
        raise ValueError(f'Unknown AssignmentExpression type: {x.type=}')


def extract_js_func_params(params_list):
    return map(_extract_params, params_list)


def _extract_params_from_function_expression(x):
    return extract_js_func_params(x.params)


def extract_func_name_and_params(ast_node: AstNode):
    """Extract one or several function ``(name, params)`` pair(s) from an AST node"""
    x = ast_node
    if x.type == 'FunctionDeclaration':
        yield x.id.name, list(extract_js_func_params(x.params))
    elif x.type == 'AssignmentExpression':
        yield (
            _extract_name_from_assignment_expression(x),
            list(extract_js_func_params(x.right.params)),
        )
    elif x.type == 'VariableDeclarator':
        yield x.id.name, list(extract_js_func_params(x.init.params))
    elif x.type == 'VariableDeclaration':
        # Here we may have several declarations, so we use yield from
        yield from chain.from_iterable(
            map(extract_func_name_and_params, x.declarations)
        )
    elif x.type == 'ExpressionStatement':
        yield from extract_func_name_and_params(x.expression)


def func_name_and_params_pairs(js_code: str, *, encoding=None):
    ast_script = parse_js_code(js_code, encoding=encoding)
    for ast_node in ast_script.body:
        yield from extract_func_name_and_params(ast_node)


def dflt_py_to_js_value_trans(x):
    if isinstance(x, bool):
        return str(x).lower()
    elif isinstance(x, str):
        return f'"{x}"'  # surround with quotes
    return x


# TODO: Add value transformer (routing). For example, booleans, True->true
def _js_func_call(
    *args,
    __sig,
    __func_call_template,
    __value_trans=dflt_py_to_js_value_trans,
    __apply_defaults=True,
    **kwargs,
):
    _kwargs = __sig.kwargs_from_args_and_kwargs(
        args, kwargs, apply_defaults=__apply_defaults
    )
    inputs = map(__value_trans, _kwargs.values())
    inputs = ', '.join(map(str, inputs))
    return __func_call_template.format(inputs=inputs)


def mk_py_binder_func(
    name,
    params,
    *,
    prefix='',
    suffix='',
    doc='',
    value_trans=dflt_py_to_js_value_trans,
    apply_defaults=True,
):
    *_, func_name = name.split('.')  # e.g. object.containing.func --> func
    func_call_template = prefix + name + '({inputs})' + suffix

    sig = Sig.from_params(params)
    js_func_call = partial(
        _js_func_call,
        __sig=sig,
        __func_call_template=func_call_template,
        __value_trans=value_trans,
        __apply_defaults=apply_defaults,
    )
    js_func_call = sig(js_func_call)
    js_func_call.__name__ = func_name
    js_func_call.__doc__ = doc

    return js_func_call


class JsBridge:
    """
    The default class to make instances that will contain methods that mirror JS
    function calls
    """


def add_js_call_attributes_to_obj(
    js_code: str,
    *,
    obj: Any = None,
    name: str | None = None,
    encoding: str | None = None,
    forbidden_method_names=(),
    apply_defaults=True
):
    """Add js call functions as attributes to an object (by default a new JsBridge
    instance)."""
    if obj is None:
        obj = JsBridge()

    forbidden_method_names = set(forbidden_method_names)

    for full_func_ref, params in func_name_and_params_pairs(js_code, encoding=encoding):
        *_, func_name = full_func_ref.split('.')  # e.g. object.containing.func --> func
        # TODO: Could specify a recovery function that finds another name instead of
        #  raising an error
        if func_name in forbidden_method_names:
            raise ValueError(
                f"This func name was already used, or mentioned in "
                f"the forbidden_method_names argument: {func_name}"
            )
        setattr(
            obj,
            func_name,
            mk_py_binder_func(full_func_ref, params, apply_defaults=apply_defaults)
        )

    if name:
        obj.__name__ = name

    return obj
