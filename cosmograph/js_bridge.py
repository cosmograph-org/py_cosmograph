"""Utils to bridge with JS"""

import os
from pathlib import Path
from functools import partial
from dol.signatures import Sig

import esprima

AstTree = esprima.nodes.Script


# TODO: Parse out js docs and add them to py mirror function


def parse_js_code(js_code: str, encoding: str | None = None) -> AstTree:
    if os.path.isfile(js_code):
        js_code = Path(js_code).read_text(encoding=encoding)
    return esprima.parse(js_code)


def _extract_params(x):
    if x.type == 'Identifier':
        return dict(name=x.name)
    elif x.type == 'AssignmentPattern':
        return dict(name=x.left.name, default=x.right.value)
    else:
        raise ValueError(f'Unknown param type: {x.type=}')


def extract_js_func_params(params_list):
    return map(_extract_params, params_list)


def function_signatures(t: AstTree):
    for x in t.body:
        if x.type == 'FunctionDeclaration':
            yield x.id.name, list(extract_js_func_params(x.params))


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
        **kwargs
):
    _kwargs = __sig.kwargs_from_args_and_kwargs(
        args, kwargs, apply_defaults=__apply_defaults
    )
    inputs = map(__value_trans, _kwargs.values())
    inputs = ', '.join(map(str, inputs))
    return __func_call_template.format(inputs=inputs)


def mk_py_binder_func(
        name, func_sig, *, prefix='', suffix='', doc='',
        value_trans=dflt_py_to_js_value_trans,
        apply_defaults=True,
):
    func_call_template = prefix + name + '({inputs})' + suffix

    sig = Sig.from_params(func_sig)
    js_func_call = partial(
        _js_func_call,
        __sig=sig,
        __func_call_template=func_call_template,
        __value_trans=value_trans,
        __apply_defaults=apply_defaults,
    )
    js_func_call = sig(js_func_call)
    js_func_call.__name__ = name
    js_func_call.__doc__ = doc

    return js_func_call


class JsBridge:
    """A class that will contain methods that mirror JS function calls"""


def js_code_to_py_methods(
    js_code: str, *, name: str | None = None, encoding: str | None = None
):
    t = parse_js_code(js_code, encoding=encoding)

    js = JsBridge()

    for name, func_sig in function_signatures(t):
        setattr(js, name, mk_py_binder_func(name, func_sig))

    if name:
        js.__name__ = name

    return js
