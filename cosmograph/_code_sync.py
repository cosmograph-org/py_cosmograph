"""
Synching code to the SSOT.

Note: The `_resources` module has the utilities to extract, diagnose, and produce 
the SSOT from the JS codebase.

This _code_sync module is meant to contain the code that is used to inject this SSOT 
into the python code.
"""

import inspect
import textwrap
import ast
import re
from functools import partial
from inspect import Signature


def replace_function_definition_in_module(module, function_name, new_function_code):
    """
    Replaces the definition of a specified function in a module with a new code string,
    returning the updated module as a single string. If the function is not found,
    the original module string is returned unchanged.

    Parameters
    ----------
    module : str or module
        Either a string containing the code of a Python module, or an actual Python module
        object (e.g. a loaded module).
    function_name : str
        The name of the function to replace.
    new_function_code : str
        A string containing the replacement code for the function. This should be a complete
        function definition, e.g.:
            def my_func(...):
                ...
        or including decorators, etc.

    Returns
    -------
    str
        A string of the entire module code, with the specified function replaced by the
        provided code.

    Raises
    ------
    SyntaxError
        If the provided module string is not valid Python syntax and cannot be parsed.
    ValueError
        If the function cannot be found in the provided module code.

    Examples
    --------
    Replace a function 'foo' in a module code string:

    >>> original_code = '''
    ... import math
    ...
    ... def foo(x):
    ...     return x + 1
    ...
    ... def bar(y):
    ...     return y * 2
    ... '''
    >>> new_foo_code = '''
    ... def foo(x, y=10):
    ...     return x + y
    ... '''
    >>> updated = replace_function_definition_in_module(original_code, 'foo', new_foo_code)
    >>> print(updated)
    <BLANKLINE>
    import math
    <BLANKLINE>
    <BLANKLINE>
    def foo(x, y=10):
        return x + y
    <BLANKLINE>
    def bar(y):
        return y * 2

    Or replace a function in an actual imported module:

    >>> # Suppose we have a module object 'some_module' loaded.
    >>> # new_bar_code = '''def bar(a, b): return a - b'''
    >>> # updated_code = replace_function_definition_in_module(some_module, 'bar', new_bar_code)
    >>> # # 'updated_code' now contains the entire source for 'some_module', with 'bar' replaced.
    """

    # 1. If `module` is a module object, retrieve its source via inspect.getsource
    if not isinstance(module, str):
        try:
            module_source = inspect.getsource(module)
        except (OSError, TypeError):
            raise ValueError(
                "Could not retrieve source from the provided module object."
            )
    else:
        module_source = module

    # Dedent the source so AST parsing will be consistent
    dedented_source = textwrap.dedent(module_source)

    # 2. Parse the code into an AST
    try:
        mod_ast = ast.parse(dedented_source)
    except SyntaxError as e:
        raise SyntaxError(f"Invalid Python code for module: {e}")

    # 3. Find the function in the AST
    func_node = None
    for node in mod_ast.body:
        if (
            isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
            and node.name == function_name
        ):
            func_node = node
            break

    if not func_node:
        # If function is not found, return the original code unchanged or raise an error
        # Here we raise an error for clarity, but you could opt to just return original code.
        raise ValueError(f"Function '{function_name}' not found in the module.")

    # 4. Determine the region of lines to replace
    # By default, the AST node's lineno points to the line where 'def <function>' begins,
    # and end_lineno points to the last line of the function. If the function has decorators,
    # the line for the first decorator is in node.decorator_list, each having its own lineno.
    # We'll replace from the topmost decorator (if any) through end_lineno.

    start_line = func_node.lineno
    if func_node.decorator_list:
        # The first decorator might appear above the function def line
        decorator_line_numbers = [dec.lineno for dec in func_node.decorator_list]
        start_line = min([start_line] + decorator_line_numbers)

    end_line = func_node.end_lineno

    # These line numbers are 1-based, so we need to adapt to 0-based indexing in the split lines
    original_lines = dedented_source.splitlines()

    # 5. Replace lines from start_line-1 to end_line with the new code
    #    The new code may have different indentation or structure, so do not indent automatically.
    #    Just insert it literally (assuming new_function_code is valid code).
    replaced_lines = (
        original_lines[: start_line - 1]
        + new_function_code.splitlines()
        + original_lines[end_line:]
    )

    # 6. Rebuild the updated module code
    updated_code = "\n".join(replaced_lines)

    return updated_code


def extract_function_source(func):
    """
    Extracts the source code of a function and removes leading indentation.

    Parameters
    ----------
    func : callable
        The function from which to extract the source.

    Returns
    -------
    str
        The de-indented source code of the function.

    Examples
    --------
    >>> def example_func():
    ...     pass
    >>> extract_function_source(example_func).strip()
    'def example_func():\\n    pass'
    """
    original_source = inspect.getsource(func)
    return textwrap.dedent(original_source)


import ast
import re

import ast
import re
import textwrap


def parse_docstring_and_body(source_code):
    r"""
    Parses the source code of a function to extract its docstring and body lines.
    The docstring is determined via the AST (so single, double, or triple quotes
    are all recognized correctly), then recast as a triple-quoted string.

    Parameters
    ----------
    source_code : str
        The source code of the function.

    Returns
    -------
    tuple
        A tuple of (docstring_lines, body_lines). The first element is a list of lines
        with exactly one element: the triple-quoted docstring (if any); otherwise, an empty list.
        The second element is a list of the remaining lines that constitute the function’s body.

    Notes
    -----
    1) By default, Python captures multi-line docstrings exactly as typed, including indentation
       within the docstring. If you want to remove such indentation, you can call `textwrap.dedent`
       on the docstring before re-inserting it into triple quotes.

    2) For Python 3.8 and above, the AST nodes carry `end_lineno`, which lets us find exactly
       where the docstring statement ends in the source. For older versions, one might need
       a more heuristic approach to identify docstring lines.

    Examples
    --------
    # >>> code = '''
    # ... def example_func():
    # ...     "This is a docstring."
    # ...     pass
    # ... '''
    # >>> docstring, body = parse_docstring_and_body(code)
    # >>> docstring == ['\"\"\"This is a docstring.\"\"\"']
    # >>> body
    # ['    pass']

    # >>> code = '''
    # ... def another_example():
    # ...     '''
    # ...     Multi-line
    # ...     docstring
    # ...     '''
    # ...     x = 42
    # ...     return x
    # ... '''
    # >>> docstring, body = parse_docstring_and_body(code)
    # >>> docstring
    # ['\"\"\"\\n    Multi-line\\n    docstring\\n    \"\"\"']
    # >>> body
    # ['    x = 42', '    return x']
    """
    try:
        # Parse the code into an AST
        mod = ast.parse(source_code)
    except SyntaxError:
        # If invalid Python code, return empty docstring and the entire code as the body
        return [], source_code.splitlines()

    # Locate the first function (or async function) node
    func_node = None
    for node in mod.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            func_node = node
            break

    # If no function definition, everything is "body"
    if not func_node:
        return [], source_code.splitlines()

    # Let the AST detect the docstring. This works for single quotes, double quotes,
    # or triple quotes, including multi-line docstrings.
    original_docstring = ast.get_docstring(func_node)
    if original_docstring is not None:
        # Optionally dedent the docstring (comment out if you want to preserve exact indentation)
        # original_docstring = textwrap.dedent(original_docstring)
        # Wrap in triple quotes for consistency
        docstring_lines = [f'"""{original_docstring}"""']
    else:
        docstring_lines = []

    # Convert the entire source to lines for reference
    all_lines = source_code.splitlines()

    # Find the line index where the function definition starts
    def_pattern = r"^\s*(?:async\s+def|def)\s+"
    def_line_idx = None
    for i, line in enumerate(all_lines):
        if re.search(def_pattern, line):
            def_line_idx = i
            break

    # If we never found 'def ' or 'async def ', just treat everything as body
    if def_line_idx is None:
        return docstring_lines, all_lines

    # Default guess: body starts right after the "def" line
    start_body_idx = def_line_idx + 1

    # If there's a docstring, refine start_body_idx by checking the end_lineno of
    # the first statement (Python 3.8+). This ensures we skip all lines belonging
    # to the docstring literal.
    if original_docstring is not None and func_node.body:
        first_stmt = func_node.body[0]
        # If the docstring is recognized as an Expr node with a literal (Constant/Str),
        # we can read .end_lineno to see exactly where it ends
        if isinstance(first_stmt, ast.Expr) and hasattr(first_stmt, "end_lineno"):
            # Note: lineno/end_lineno are 1-based, but our list is 0-based
            start_body_idx = first_stmt.end_lineno

    # The body is whatever remains after the docstring
    body_lines = all_lines[start_body_idx:]
    return docstring_lines, body_lines


def build_multiline_signature(sig_obj, func_name=None):
    """
    Builds a multiline function signature and extracts parameter names.

    Parameters
    ----------
    sig_obj : str or inspect.Signature
        The function signature as a string or Signature object.
    func_name : str, optional
        The name of the function, used if `sig_obj` is an inspect.Signature.

    Returns
    -------
    tuple
        A tuple of (signature_lines, param_names). `signature_lines` is a list
        containing the multiline signature, and `param_names` is a list of
        parameter names for locals unpacking.

    Examples
    --------
    >>> from inspect import signature
    >>> def example_func(a, b=2, *args, **kwargs): pass
    >>> sig = signature(example_func)
    >>> lines, params = build_multiline_signature(sig, "new_func")
    >>> lines
    ['def new_func(', '    a,', '    b=2,', '    *args,', '    **kwargs', '):']
    >>> params
    ['a', 'b', 'args', 'kwargs']
    """
    if isinstance(sig_obj, Signature):
        params_str = str(sig_obj)
        signature_text = f"def {func_name}{params_str}:"
    else:
        signature_text = sig_obj

    def_pattern = r"^\s*(?:async\s+def|def)\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:"
    match = re.match(def_pattern, signature_text)
    if not match:
        return [signature_text], []

    func_name = match.group(1)
    inner_args = match.group(2).strip()

    arg_parts = []
    bracket_level = 0
    current_part = []
    for ch in inner_args:
        if ch in "([{":
            bracket_level += 1
        elif ch in ")]}":
            bracket_level -= 1
        elif ch == "," and bracket_level == 0:
            arg_parts.append("".join(current_part).strip())
            current_part = []
            continue
        current_part.append(ch)
    if current_part:
        arg_parts.append("".join(current_part).strip())

    sig_lines = [f"def {func_name}("]
    for i, part in enumerate(arg_parts):
        comma = "," if i < len(arg_parts) - 1 else ""
        sig_lines.append(f"    {part}{comma}")
    sig_lines.append("):")

    param_names = []
    for part in arg_parts:
        part = part.strip()
        if part.startswith("**"):
            param_names.append(part[2:])
        elif part.startswith("*"):
            param_names.append(part[1:])
        else:
            param_names.append(part.split("=")[0].strip())

    return sig_lines, param_names


def build_data_extraction_line(param_names):
    """
    Builds a line that unpacks locals().values() into parameter names.

    Parameters
    ----------
    param_names : list of str
        The names of the parameters.

    Returns
    -------
    str
        A line of code that unpacks the parameters.

    Examples
    --------
    >>> build_data_extraction_line(['a', 'b', 'args', 'kwargs'])
    '    a, b, args, kwargs = locals().values()'
    """
    if not param_names:
        return "    # No parameters found"
    return f"    {', '.join(param_names)} = locals().values()"


def gather_function_code(
    signature_lines, docstring_lines, data_extraction_line, body_lines
):
    r"""
    Combines all components of a function into a single string.

    Parameters
    ----------
    signature_lines : list of str
        The lines of the function signature.
    docstring_lines : list of str
        The lines of the function docstring.
    data_extraction_line : str
        The line of code for unpacking locals.
    body_lines : list of str
        The lines of the function body.

    Returns
    -------
    str
        The complete function code as a string.

    Examples
    --------
    >>> sig_lines = ['def func(', '    a,', '    b=2,', '):']
    >>> doc_lines = ['"A docstring."']
    >>> extraction_line = '    a, b = locals().values()'
    >>> body_lines = ['    return a + b']
    >>> print(gather_function_code(sig_lines, doc_lines, extraction_line, body_lines))
    def func(
        a,
        b=2,
    ):
        "A docstring."
        a, b = locals().values()
        return a + b
    """

    def line_generator():
        yield from signature_lines
        if docstring_lines:
            for dl in docstring_lines:
                yield "    " + dl
        yield data_extraction_line
        yield from body_lines

    return "\n".join(line_generator())


def code_str_with_signature(func, sig, suffix="_with_new_sig"):
    """
    Main function to construct a new function definition string.
    """
    original_source = extract_function_source(func)
    docstring_lines, body_lines = parse_docstring_and_body(original_source)
    signature_lines, param_names = build_multiline_signature(
        sig, func.__name__ + suffix
    )
    data_extraction_line = build_data_extraction_line(param_names)
    return gather_function_code(
        signature_lines=signature_lines,
        docstring_lines=docstring_lines,
        data_extraction_line=data_extraction_line,
        body_lines=body_lines,
    )


import ast


def extract_func_name_from_code(code_str):
    """
    Extracts the name of the first function defined in a Python code string using `ast`.

    Parameters
    ----------
    code_str : str
        The Python code string to analyze.

    Returns
    -------
    str
        The name of the first function defined in the code string.

    Raises
    ------
    ValueError
        If no function definition is found in the provided code string.

    Examples
    --------
    >>> code = '''
    ... def my_function(a, b):
    ...     return a + b
    ... '''
    >>> extract_func_name_from_code(code)
    'my_function'

    >>> code = '''
    ... async def another_function():
    ...     pass
    ... '''
    >>> extract_func_name_from_code(code)
    'another_function'

    >>> extract_func_name_from_code("x = 42")
    Traceback (most recent call last):
    ...
    ValueError: No function definition found in the provided code string.
    """
    try:
        tree = ast.parse(code_str)
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                return node.name
    except SyntaxError as e:
        raise ValueError(f"Invalid Python code provided: {e}")

    raise ValueError("No function definition found in the provided code string.")


def execute_and_get_function(code_str, func_name=None):
    """
    Executes a Python code string and returns the function object defined within it.
    If `func_name` is not provided, it extracts the function name from the code string.

    Parameters
    ----------
    code_str : str
        The Python code string to execute.
    func_name : str, optional
        The name of the function to retrieve from the executed code. If None,
        the function name is extracted from the code string.

    Returns
    -------
    callable
        The function object defined by `code_str`.

    Raises
    ------
    ValueError
        If `func_name` is not provided and no function definition is found in the code string.
    KeyError
        If the function `func_name` is not found in the executed code.

    Examples
    --------
    >>> code = '''
    ... def my_function(a, b):
    ...     return a + b
    ... '''
    >>> func = execute_and_get_function(code)
    >>> func(3, 4)
    7

    >>> code = '''
    ... def greet(name):
    ...     return f"Hello, {name}!"
    ... '''
    >>> func = execute_and_get_function(code)
    >>> func("Alice")
    'Hello, Alice!'

    >>> code = 'x = 42'
    >>> execute_and_get_function(code)
    Traceback (most recent call last):
    ...
    ValueError: No function definition found in the provided code string.
    """
    if func_name is None:
        func_name = extract_func_name_from_code(code_str)

    namespace = {}
    exec(code_str, namespace)
    if func_name not in namespace:
        raise KeyError(f"Function '{func_name}' not found in the executed code.")
    return namespace[func_name]


import inspect
import typing
from typing import get_origin, get_args


def diagnose_parameter_default(param: inspect.Parameter) -> dict:
    """
    Examines the alignment between an inspect.Parameter object's default value
    and its type annotation. Returns a dictionary with various diagnostic flags
    that may be of interest when analyzing function signatures.

    Example fields:
      - "missing_annotation": True if there is no type annotation.
      - "missing_default": True if there is no default value.
      - "none_without_optional": True if the default is None but the annotation does not allow None.
      - "default_not_in_type": True if the default is not None and is not an instance of the annotated type.
      - "suspected_type_mismatch": True if the type annotation suggests a container or union and
        the default fails rudimentary consistency checks.

    Notes:
      - Uses only standard library for type inspection. If a more robust approach
        is needed, especially for containers (e.g., List[int] or Dict[str, str]) or
        deeper type checks, third-party libraries like 'typeguard' could be considered.
    """

    diagnosis = {}

    # 1. Check if annotation is missing.
    if param.annotation is inspect._empty:
        diagnosis["missing_annotation"] = True
        return diagnosis
    else:
        diagnosis["missing_annotation"] = False

    # 2. Check if default is missing.
    if param.default is inspect._empty:
        diagnosis["missing_default"] = True
        # Still return partial results, no reason to proceed with default-based checks
        return diagnosis
    else:
        diagnosis["missing_default"] = False

    # Helper to detect if an annotation is an optional type (including Union[..., NoneType]).
    def is_annotation_optional(anno) -> bool:
        # Detect Optional[X] which is a Union[X, type(None)]
        # or some Union that includes None.
        origin = get_origin(anno)
        if origin is typing.Union:
            args = get_args(anno)
            return any(a is type(None) for a in args)
        return False

    # Helper to check if val matches the annotated type. This is a limited check:
    # - If annotation is a Union, check if val is instance of any type in the union
    # - If annotation is a generic container, this won't fully check subtype correctness
    #   but it will check the container type itself (e.g., list vs. dict).
    # For deeper checks, a library like 'typeguard' is more suitable.
    def is_value_instance_of_annotation(val, anno) -> bool:
        origin = get_origin(anno)
        if origin is typing.Union:
            # For Union types, check membership in any possibility
            args = get_args(anno)
            return any(is_value_instance_of_annotation(val, arg) for arg in args)
        elif origin is None:
            # Not a Union or a generic type; just do regular isinstance check
            if anno is type(None):
                return val is None
            return isinstance(val, anno)
        else:
            # A generic type like list, dict, etc. We'll just compare the origin type
            # with the type of the object (e.g., 'list' if it's List[int], etc.).
            # This won't validate item subtypes (e.g., List[int] vs List[str]).
            if isinstance(val, origin):
                return True
            return False

    # 3. Check if the default is None without being optional.
    if param.default is None and not is_annotation_optional(param.annotation):
        diagnosis["none_without_optional"] = True
    else:
        diagnosis["none_without_optional"] = False

    # 4. Check if the default value is out of alignment with the annotation.
    if param.default is not None:
        if not is_value_instance_of_annotation(param.default, param.annotation):
            diagnosis["default_not_in_type"] = True
        else:
            diagnosis["default_not_in_type"] = False
    else:
        # If default is None, it's either allowed or not, and that's covered above
        diagnosis["default_not_in_type"] = False

    # Optionally, add more granular checks here for container or union complexity.
    # For instance, we could identify if the annotation is a container type
    # (List, Set, Dict, etc.) and attempt deeper checks. That is beyond this
    # minimal demonstration.

    return diagnosis


# import inspect
# import textwrap
# import ast
# import re
# from functools import partial
# from inspect import Signature


# def code_str_with_signature(func, sig, suffix="_with_new_sig"):
#     """
#     Constructs a string that defines a new function with the following properties:

#     1. The signature is taken from 'sig':
#        - If 'sig' is a string (e.g. 'def new_func(a, b=2, *args, **kwargs):'),
#          then it is used as-is (after splitting out parameters onto multiple lines).
#        - If 'sig' is an inspect.Signature object, a function definition string is built:
#              def <func.__name__><suffix>(<signature>):
#     2. The docstring is exactly that of 'func' (preserved in triple quotes).
#     3. The body is exactly that of 'func', except for a first line that rebinds parameters
#        by unpacking 'locals().values()' into the signature’s parameter names.
#     4. The returned value is the complete function code (a Python source string).

#     Parameters
#     ----------
#     func : callable
#         The original function (from which to extract body and docstring).
#     sig : str or inspect.Signature
#         Either a string of the form:
#             def new_func(a, b=2, *args, **kwargs):
#         or an inspect.Signature object (e.g. from 'signature(func_to_copy)').
#     suffix : str, optional
#         Suffix to append to the function name when building from an inspect.Signature object.
#         Only used if 'sig' is a Signature (not a string). Defaults to '_with_new_sig'.

#     Returns
#     -------
#     str
#         A string containing valid Python code defining the new function.
#     """

#     # ----------------------------------------------------------------
#     # 1. Extract original function source (de-indented)
#     # ----------------------------------------------------------------
#     def extract_function_source(f):
#         original_source = inspect.getsource(f)
#         return textwrap.dedent(original_source)

#     # ----------------------------------------------------------------
#     # 2. Parse out docstring and body using AST
#     # ----------------------------------------------------------------
#     def parse_docstring_and_body(source_code):
#         """
#         Parses the source code of a function to extract:
#           - The docstring (as triple-quoted lines)
#           - The lines of the body after the docstring
#         """
#         mod = ast.parse(source_code)
#         func_node = None
#         for node in mod.body:
#             if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
#                 func_node = node
#                 break
#         if not func_node:
#             # If we can't find any function node, return the entire source as body
#             return None, source_code.splitlines()

#         # Extract docstring
#         original_docstring = ast.get_docstring(func_node)
#         docstring_lines = []
#         if original_docstring:
#             docstring_lines = [f'"""{original_docstring}"""']

#         # Convert source code to lines
#         all_lines = source_code.splitlines()

#         # Find index of "def " or "async def"
#         def_pattern = r'^\s*(?:async\s+def|def)\s+'
#         def_line_idx = None
#         for i, line in enumerate(all_lines):
#             if re.search(def_pattern, line):
#                 def_line_idx = i
#                 break

#         # If no function def line found, fallback
#         if def_line_idx is None:
#             return docstring_lines, all_lines

#         # Next, figure out where the body actually begins
#         start_body_idx = def_line_idx + 1

#         # If we detected a docstring, find where it ends
#         if original_docstring:
#             triple_quote_pattern = r'("""|\'\'\')'
#             doc_open = None
#             for j in range(def_line_idx + 1, len(all_lines)):
#                 if doc_open is None:
#                     match = re.search(triple_quote_pattern, all_lines[j])
#                     if match:
#                         doc_open = match.group(1)
#                 else:
#                     # Keep searching until we find that closing triple quote
#                     if re.search(doc_open, all_lines[j]):
#                         start_body_idx = j + 1
#                         break

#         body_lines = all_lines[start_body_idx:]
#         return docstring_lines, body_lines

#     # ----------------------------------------------------------------
#     # 3. Turn a signature (string or Signature object) into:
#     #       (list_of_def_lines, list_of_parameter_names)
#     #    where list_of_def_lines is the multiline def lines, and
#     #    list_of_parameter_names is for the locals().values() unpack.
#     # ----------------------------------------------------------------
#     def build_multiline_signature(sig_obj):
#         """
#         If 'sig_obj' is a string:
#             'def new_func(a, b=2, *args, **kwargs):'
#           Then parse it to produce a multiline version and the param names.

#         If 'sig_obj' is an inspect.Signature:
#           Then build: 'def <func.__name__><suffix>(<parameters>):'
#           from the signature, also parse multiline, etc.

#         Returns
#         -------
#         (signature_lines, param_names)
#           signature_lines: list[str]  e.g. ["def new_func(", "    a,", "    b=2,", "    *args,", "    **kwargs", "):"]
#           param_names: list[str]   e.g. ["a", "b", "args", "kwargs"]
#         """
#         # If the signature is an inspect.Signature, convert it to a "def name(...) :" string
#         if isinstance(sig_obj, Signature):
#             # Build "def <func_name><suffix>(params):"
#             params_str = str(sig_obj)  # e.g. (data=None, *, points=None, links=None)
#             function_name = func.__name__ + suffix
#             signature_text = f"def {function_name}{params_str}:"
#         else:
#             # Assume it's a str
#             signature_text = sig_obj

#         # Regex to extract the function name and the parentheses content
#         def_pattern = r'^\s*(?:async\s+def|def)\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:'
#         match = re.match(def_pattern, signature_text)
#         if not match:
#             # If it doesn't match, just return the entire text as a single line
#             return [signature_text], []

#         func_name = match.group(1)
#         inner_args = match.group(2).strip()

#         # Split arguments by commas at top-level
#         arg_parts = []
#         bracket_level = 0
#         current_part = []
#         for ch in inner_args:
#             if ch in "([{":
#                 bracket_level += 1
#                 current_part.append(ch)
#             elif ch in ")]}":
#                 bracket_level -= 1
#                 current_part.append(ch)
#             elif ch == ',' and bracket_level == 0:
#                 arg_parts.append("".join(current_part).strip())
#                 current_part = []
#             else:
#                 current_part.append(ch)
#         if current_part:
#             arg_parts.append("".join(current_part).strip())

#         # Build the multiline signature lines
#         sig_lines = [f"def {func_name}("]
#         for i, part in enumerate(arg_parts):
#             comma = "," if i < len(arg_parts) - 1 else ""
#             sig_lines.append(f"    {part}{comma}")
#         sig_lines.append("):")

#         # We also want the param names (for locals().values())
#         # e.g. "data=None" -> "data", "*args" -> "args", etc.
#         param_names = []
#         for part in arg_parts:
#             part_stripped = part.strip()
#             if part_stripped.startswith("**"):
#                 param_names.append(part_stripped.replace("**", "", 1).strip())
#             elif part_stripped.startswith("*"):
#                 param_names.append(part_stripped.replace("*", "", 1).strip())
#             else:
#                 # If it has an "=", split out the left side
#                 eq_idx = part_stripped.find("=")
#                 if eq_idx != -1:
#                     param_names.append(part_stripped[:eq_idx].strip())
#                 else:
#                     param_names.append(part_stripped)

#         return sig_lines, param_names

#     # ----------------------------------------------------------------
#     # 4. Build the locals().values() unpack line
#     # ----------------------------------------------------------------
#     def build_data_extraction_line(param_names):
#         """
#         E.g., for param_names=['data','points','links'],
#         returns: '    data, points, links = locals().values()'
#         """
#         if not param_names:
#             return "    # No parameters found"
#         unpack_str = ", ".join(param_names)
#         return f"    {unpack_str} = locals().values()"

#     # ----------------------------------------------------------------
#     # 5. Assemble all the code lines into a single string
#     # ----------------------------------------------------------------
#     def gather_function_code(
#         signature_lines, docstring_lines, data_extraction_line, body_lines
#     ):
#         """
#         Returns the final function definition by concatenating:
#           - multiline signature
#           - docstring (indented)
#           - data extraction line
#           - original body
#         """

#         def line_generator():
#             # Multiline signature
#             yield from signature_lines

#             # Original docstring (indented by 4 spaces)
#             if docstring_lines:
#                 for dl in docstring_lines:
#                     yield "    " + dl

#             # Unpacking line
#             yield data_extraction_line

#             # The rest of the body (already has indentation from the original function)
#             yield from body_lines

#         # Gather all lines at once
#         return "\n".join(line_generator())

#     # ----------------------------
#     # Main flow of code_str_with_signature
#     # ----------------------------
#     original_source = extract_function_source(func)
#     docstring_lines, body_lines = parse_docstring_and_body(original_source)

#     signature_lines, param_names = build_multiline_signature(sig)
#     data_extraction_line = build_data_extraction_line(param_names)

#     return gather_function_code(
#         signature_lines=signature_lines,
#         docstring_lines=docstring_lines,
#         data_extraction_line=data_extraction_line,
#         body_lines=body_lines,
#     )
