"""Tests for js_bridge"""

from cosmograph.js_bridge import (
    func_name_and_params_pairs,
    add_js_call_attributes_to_obj
)
from cosmograph.util import js_files

test01_js_code = js_files['test01']


def test_func_name_and_params_pairs():
    pairs = list(func_name_and_params_pairs(test01_js_code))
    assert pairs == [
        (
            'foo',
            [
                {'name': 'a'},
                {'name': 'b', 'default': 'hello'},
                {'name': 'c', 'default': 3},
            ],
        ),
        (
            'bar',
            [
                {'name': 'green'},
                {'name': 'eggs', 'default': 'food'},
                {'name': 'and', 'default': True},
                {'name': 'ham', 'default': 4},
            ],
        ),
        ('add_one', [{'name': 'x'}]),
        ('with_let', [{'name': 'x'}]),
        ('with_const', [{'name': 'x'}]),
        # Note that the name here is dot-separated!
        ('window.SetData', [{'name': 'id'}, {'name': 'nodes'}, {'name': 'links'}]),
        ('obj', [{'name': 'exports'}]),
    ]


def test_add_js_call_attributes_to_obj():
    js = add_js_call_attributes_to_obj(test01_js_code)

    # js has two methods called bar and foo
    assert sorted([x for x in dir(js) if not x.startswith('_')]) == [
        'SetData', 'add_one', 'bar', 'foo', 'obj', 'with_const', 'with_let'
    ]

    # they mirror the signatures of the underlying JS functions
    from inspect import signature
    assert str(signature(js.foo)) == "(a, b='hello', c=3)"
    assert str(signature(js.bar)) == "(green, eggs='food', and=True, ham=4)"

    # Calling this function returns a string
    # (the code to call the underlying JS function)
    assert js.foo(1, 'hi', 5) == 'foo(1, "hi", 5)'

    # Notice that you can use positional or keyword arguments
    # Also, notice that though "SetData" is the name of js's attribute,
    # the function call string does indeed use the original full reference:
    # ``window.SetData``
    assert js.SetData('id', nodes='nodes', links='links') == (
        'window.SetData("id", "nodes", "links")'
    )

    # Notice that the python (signature) defaults are applied before translating to JS
    assert js.bar(42) == 'bar(42, "food", true, 4)'

    alt_js = add_js_call_attributes_to_obj(test01_js_code, apply_defaults=False)
    # You can opt not to do this by specifying apply_defaults=False
    # This will result in only injecting those inputs you specify in the js call string,
    # which will have the effect of letting JS apply it's defaults, what ever they are
    alt_js = add_js_call_attributes_to_obj(test01_js_code, apply_defaults=False)
    assert alt_js.bar(42) == 'bar(42)'

