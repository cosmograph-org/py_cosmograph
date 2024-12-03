"""
Analyze properties of the various sources of Cosmograph configuration information,
compare them, generate a reports, and finally, generate a SoT for the python
cosmograph interfaces.

In this module, we gather the tools needed to:
* make normalized configs data from various sources
* compare these to the existing saved ones
* update the existing saved ones
* diagnose/compare these saved configs


(From [this Dec 2024 section below](https://github.com/cosmograph-org/cosmograph/discussions/292#discussioncomment-11447302):)
* Defaults: From the [cosmos/.../variables.ts](https://github.com/cosmograph-org/cosmos/blob/main/src/variables.ts) file of the main branch. This file uses a standard, `export const NAME = DEFAULT_VALUE` format, so can robustly be parsed. 
* Types: From the five TS files;
   * from default branch: [cosmos/config.ts](https://github.com/cosmograph-org/cosmos/blob/next/src/config.ts)
   * from cosmograph/config dev branch; [config.ts](https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/config.ts), [data.ts](https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/data.ts), [labels.ts](https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/labels.ts), [simulation.ts](https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/simulation.ts)
* Descriptions: Could be from the TS files above, and/or from md docs. Permanent source to be determined, but currently was pointed to [this commit](https://github.com/cosmograph-org/cosmograph/blob/8c868898f256a207e12085a17566943bea49c28a/packages/website/pages/docs/v2/widget/configuration.mdx)

"""

# -------------------------------------------------------------------------------------
# Creating the configs source files from various sources
from functools import lru_cache
from cosmograph.util import json_files


source_urls = {
    'cosmos/variables.ts': 'https://github.com/cosmograph-org/cosmos/blob/main/src/variables.ts',
    'cosmos/config.ts': 'https://github.com/cosmograph-org/cosmos/blob/next/src/config.ts',
    'cosmograph/config.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/config.ts',
    'cosmograph/data.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/data.ts',
    'cosmograph/labels.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/labels.ts',
    'cosmograph/simulation.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/simulation.ts',
    'cosmograph/configuration.mdx': 'https://github.com/cosmograph-org/cosmograph/blob/8c868898f256a207e12085a17566943bea49c28a/packages/website/pages/docs/v2/widget/configuration.mdx',
}

# # For public urls, you just need to get a raw url, and download normally
# # But for private urls, you need to authenticate first, so we're not going to go the raw url route
# raw_file_url = partial(transform_github_url, target_url_type='raw_file')
# source_raw_urls = {k: raw_file_url(v) for k, v in source_urls.items()}


@lru_cache(maxsize=1)
def get_source_strings(refresh=False):
    if refresh or '__source_strings.json' not in json_files:
        from hubcap import (
            github_file_contents,
        )  # requires pip install hubcap (and set GITHUB_TOKEN env var)

        source_strings = {k: github_file_contents(v) for k, v in source_urls.items()}
        json_files['__source_strings.json'] = source_strings
    else:
        source_strings = json_files['__source_strings.json']
    return source_strings


# --------------------------------------------------------------------------------------
# Parsing Typescript (with AI)

from functools import partial
from jy.ts_parse import parse_ts_with_oa, parse_ts as grammar_ts_parser
from dol import Pipe


_extra_contexts = {
    "very_verbose_on_defaults": """

    It is imparative that for each property, you try to see if you can find a default 
    value, and include it as a "default" field in the json schema of that property.

    For example, the following typescript code:

    export interface MyInterface {
    /**
    * Callback function that will be called when dragging ends.
    * First argument is a D3 Drag Event:
    * `(event: D3DragEvent) => void`.
    * Default value: `undefined`
    */
    onDragEnd?: (e: D3DragEvent<HTMLCanvasElement, undefined, Hovered>) => void;
    /**
    * Decay coefficient. Use smaller values if you want the simulation to "cool down" slower.
    * Default value: `5000`
    */
    decay?: number;
    /**
    * Gravity force coefficient.
    * Default value: `0.25`
    */
    gravity?: number;
    }

    Will lead to onDragEnd having a default value of "undefined", 
    decay having a default value of 5000, and gravity having a default value of 0.25.

""",
    "verbose_on_defaults": """

    It is imparative that for each property, you try to see if you can find a default 
    value, and include it as a "default" field in the json schema of that property.
""",
    "empty": "",
}


_use_extra_context_key = "empty"
_extra_context = _extra_contexts[_use_extra_context_key]


ai_ts_parser = partial(parse_ts_with_oa, extra_context=_extra_context)
my_ts_parser = ai_ts_parser  # backcompatibility alias


def ai_md_parser(md_string: str) -> dict:
    import oa

    f = oa.prompt_json_function(
        """
        Parse through the following markdown contents and extract information 
        about the objects in them, returning a json that fits the json_schema.
        The "group" field is supposed to denote the section where you found the property;
        i.e. "Minimal Configuration for Points", "Additional Points Configuration", etc.

        You must always include a default field in the properties. 
        It is usually in the descriptions as "Default value: ...". 
        If you can't find a default, please just set it to "NO_DEFAULT", but still include the field.

        {md_string}
        """,
        json_schema=parse_md_schema,  # note: definition of parse_md_schema at end of module
    )

    return f(md_string)


def print_interfaces(
    interfaces, name=None, *, indent_str=' ' * 4, verify=True, smart_preproc=True
):
    '''
    Print the interfaces properties in a nice format.

    ```python

    import requests
    from cosmograph.wip.config_properties import my_ts_parse, print_json_schema

    src_url = 'https://raw.githubusercontent.com/cosmograph-org/cosmograph/80721d1631a90b42f0797ea22332764a4bcd4356/packages/cosmograph/src/modules/cosmograph/config/config.ts?token=GHSAT0AAAAAACSGWAOWME7Q5ZTEZMKWSVX6Z2IGOPA'
    ts_code = requests.get(src_url).text
    json_schema = my_ts_parse(ts_code)

    interfaces = json_schema['interfaces']
    print_json_schema(interfaces, verify=True)

    ```

    '''
    if smart_preproc:
        if 'interfaces' in interfaces:
            interfaces = interfaces['interfaces']

    if name:
        print(f"* **{name}**")
    # print(f"{k}:\t{[x['name'] for x in v]}")
    for interface in interfaces:
        if verify:
            assert set(interface).issuperset(
                {
                    'name',
                    'description',
                    'properties',
                }
            ), "Use verify=False to skip this check"
        property_names = [x['name'] for x in interface['properties']]
        print(f"{indent_str}* **{interface['name']}**: ({len(property_names)})")
        import lkj

        lkj.wrapped_print(property_names, max_width=100, line_prefix=indent_str * 2)


import pandas as pd


def process_schema_object(obj):
    name = obj.get('name', 'Unnamed')
    properties = obj.get('properties', [])
    df = pd.DataFrame(properties)
    return name, df


def json_schema_to_dataframe(schema):
    if isinstance(schema, dict):
        if 'properties' in schema:
            # Single object with properties
            name, df = process_schema_object(schema)
            return df
        else:
            # Dict with keys like 'interfaces', 'types', etc.
            result = {}
            for key, value in schema.items():
                if isinstance(value, list):
                    obj_dict = {}
                    for item in value:
                        name, df = process_schema_object(item)
                        obj_dict[name] = df
                    result[key] = obj_dict
            return result
    elif isinstance(schema, list):
        # List of objects
        result = {}
        for item in schema:
            name, df = process_schema_object(item)
            result[name] = df
        return result
    else:
        raise ValueError("Invalid schema format")


def dataframes_to_markdown(
    dataframes, *, columns=None, index=False, to_markdown_kwargs=()
):
    for file_name, v in dataframes.items():
        yield f"## {file_name}\n\n"
        for group, df in v.items():
            if columns:
                # Filter columns that exist in the dataframe
                df = df[[col for col in columns if col in df.columns]]
            yield f"### {group}\n\n"
            yield df.to_markdown(index=index, **dict(to_markdown_kwargs))
            yield "\n\n\n"


# -------------------------------------------------------------------------------------
from functools import partial, cached_property
from typing import Callable
from collections import defaultdict

from dol import Pipe

from cosmograph.util import json_files


def gather_items(pairs, *, val_filt: Callable = lambda x: True):
    """Group (k, v) items by k and filter the resulting grouped list of values"""
    d = defaultdict(list)
    for key, value in pairs:
        d[key].append(value)
    return {k: v for k, v in d.items() if val_filt(v)}


find_duplicates = partial(gather_items, val_filt=lambda x: len(x) > 1)


def to_dict(iterable, key_field: str):
    extract_key = itemgetter(key_field)
    return {extract_key(x): x for x in iterable}


def remove_empty_defaults(elements, no_default_sentinel='NO_DEFAULT'):
    for d in elements:
        if d['default'] == no_default_sentinel:
            d.pop('default')
        yield d


def setdiff(a, b):
    return set(a) - set(b)


import json
from operator import itemgetter
from functools import lru_cache
from dol import FuncReader, redirect_getattr_to_getitem


class ConfigSourceDicts:
    @staticmethod
    def old_config_info():
        # config_info
        _config_info = json_files['config_info.json']
        config_info_properties = to_dict(
            _config_info, 'Property'
        )  # {x['Property']: x for x in config_info}
        assert len(config_info_properties) == len(
            _config_info
        ), f"config_info had some duplicate properties"
        return _config_info

    @staticmethod
    def old_cosmos_config():
        _cosmos_config = json_files['cosmos_config.json']
        assert list(_cosmos_config) == ['config']
        _cosmos_config = _cosmos_config['config']
        cosmo_config_properties = to_dict(_cosmos_config, 'Property')
        assert len(cosmo_config_properties) == len(
            _cosmos_config
        ), f"cosmos_config had some duplicate properties"
        return _cosmos_config

    @staticmethod
    def widget_config_from_md():
        widget_config = json_files['_widget_config_from_md.json']
        assert set(widget_config) == {'interfaces'}
        assert len(widget_config['interfaces']) == 1
        assert set(widget_config['interfaces'][0]) == {
            'description',
            'name',
            'properties',
        }
        t = remove_empty_defaults(widget_config['interfaces'][0]['properties'])
        widget_config_from_md_properties = to_dict(t, 'name')

        assert len(widget_config_from_md_properties) == len(
            widget_config['interfaces'][0]['properties']
        ), f"widget_config_from_md had some duplicate properties"
        return widget_config_from_md_properties

    @staticmethod
    def widget_config_from_ts():
        from lkj import camel_to_snake

        widget_config = json_files['_widget_config.json']

        def _widget_config_properties():
            assert sorted(widget_config) == [
                'config.ts',
                'cosmos/config.ts',
                'data.ts',
                'labels.ts',
                'simulation.ts',
            ]

            for widget_config_value in widget_config.values():
                assert set(widget_config_value) == {'interfaces'}
                interfaces = widget_config_value['interfaces']
                for interface in interfaces:
                    assert set(interface) == {'description', 'name', 'properties'}
                    for prop in interface['properties']:
                        assert set(prop).issuperset(
                            {'description', 'name', 'type'}
                        ), f"missing fields: {set(['description', 'name', 'type']) - set(prop)=})"
                        prop['py_name'] = camel_to_snake(prop['name'])
                        prop['origin_name'] = interface['name']
                        yield prop

        interfaces = list(_widget_config_properties())
        # print(f"{len(interfaces)=}")

        widget_config_properties = to_dict(interfaces, 'name')
        # assert len(widget_config_properties) == len(interfaces), f"widget_config had some duplicate properties"

        duplicates = find_duplicates(((x['name'], x) for x in interfaces))
        assert set(duplicates) == {
            'disableSimulation',
            'showTopLabelsLimit',
            'showHoveredPointLabel',
            'staticLabelWeight',
            'dynamicLabelWeight',
            'labelMargin',
            'labelPadding',
        }, "Not the same duplicate widget_config_properties as before (comment out this assertion if not a problem)"

        # Solve all duplicates taking the CosmographConfig orgin_name

        def dedupper(dups):
            if len(dups) == 1:
                return dups[0]
            else:
                return next(
                    filter(lambda x: x['origin_name'] == 'CosmographConfig', dups)
                )

        dedupped_interfaces = find_duplicates(
            ((x['name'], x) for x in interfaces), val_filt=lambda x: True
        )
        dedupped_interfaces = list(map(dedupper, dedupped_interfaces.values()))

        widget_config_properties = to_dict(dedupped_interfaces, 'py_name')

        assert len(widget_config_properties) == len(
            dedupped_interfaces
        ), f"widget_config had some duplicate properties"
        # print(f"{len(widget_config_properties)=}")
        return widget_config_properties

    @staticmethod
    def traitlets():
        from cosmograph_widget import Cosmograph
        from traitlets.traitlets import BaseDescriptor

        return {
            k: v for k, v in vars(Cosmograph).items() if isinstance(v, BaseDescriptor)
        }


def get_various_configs():
    _callable_attrs = filter(callable, vars(ConfigSourceDicts).values())
    return redirect_getattr_to_getitem(FuncReader)(_callable_attrs)


config_srcs = get_various_configs()


class ConfigAnalysisDacc:
    c = config_srcs

    # ----------------------------------------------------------------------------------
    # Make the SoT for py_cosmograph

    @cached_property
    def sig_args(self):
        # sorted common keys of traitlets and TS
        return sorted(self.c.traitlets.keys() & self.c.widget_config_from_ts.keys())

    @cached_property
    def sig_and_doc_info(self):

        # get annotations from traitlets
        annotations = self.sig_dfs['traitlets'].loc[self.sig_args]['annotation']
        # get defaults from ts
        defaults = self.sig_dfs['widget_config_from_ts'].loc[self.sig_args]['default']
        defaults = self._edit_defaults(defaults)

        # get property descriptions from md
        descriptions = (
            pd.DataFrame(
                [
                    {'name': v['name'], 'description': v['description']}
                    for v in self.c.widget_config_from_md.values()
                ]
            )
            .set_index('name')
            .loc[self.sig_args]['description']
        )

        return pd.concat([annotations, defaults, descriptions], axis=1)

    # edits
    def _edit_defaults(self, defaults):
        return defaults.apply(Pipe(to_int_or_float, none_if_null, tuple_if_list))

    def save_sots(self):
        from cosmograph.util import json_files

        save_sots(self.sig_and_doc_info)

    # ----------------------------------------------------------------------------------
    # Diagnosis and analysis

    @cached_property
    def traitlets_sig(self):

        c = self.c
        py_annotations = {k: trait_to_py(v) for k, v in c.traitlets.items()}
        py_defaults = {
            k: getattr(v, 'default_value', Undefined) for k, v in c.traitlets.items()
        }
        param_dicts = [
            {
                'name': name,
                'kind': Sig.KEYWORD_ONLY,
                'annotation': py_annotations[name],
                'default': py_defaults[name],
            }
            for name in c.traitlets
        ]

        return Sig([Param(**d) for d in param_dicts])

    @cached_property
    def sig_dfs(self):
        from ju import trait_to_py
        from traitlets import Undefined
        from i2 import Sig, Param

        c = self.c

        traitlet_sig = self.traitlets_sig
        widget_config_from_ts_sig = config_dict_to_sig(c.widget_config_from_ts)
        widget_config_from_md_sig = config_dict_to_sig(c.widget_config_from_md)

        return {
            'traitlets': sig_to_df(traitlet_sig),
            'widget_config_from_ts': sig_to_df(widget_config_from_ts_sig),
            'widget_config_from_md': sig_to_df(widget_config_from_md_sig),
        }

    def print_traitlet_and_ts_diffs(self):
        print_signature_diffs()

    def print_traitlet_and_md_diffs(self):
        print_traitlet_and_md_diffs()


dacc = ConfigAnalysisDacc()

get_traitlet_sig = lambda: dacc.traitlets_sig
get_sig_dfs = lambda: dacc.sig_dfs

# --------------------------------------------------------------------------------------
# Diagnosis


from tabled import dataframe_diffs
import ju
import pandas as pd
from i2.signatures import parameter_to_dict
from dol import Pipe


def config_dict_to_sig(config_dict):
    return ju.json_schema_to_signature({'properties': config_dict})


def sig_to_df(sig):
    df = pd.DataFrame(map(parameter_to_dict, sig.params))
    df = df.drop('kind', axis=1)
    df = df.set_index('name', drop=True)
    return df


def print_df(df, max_rows=500):
    # print(df.to_string(max_rows=max_rows))
    print(df.to_markdown())


config_dict_to_dfs = Pipe(config_dict_to_sig, sig_to_df)


def _change_type_to_str(x):
    if isinstance(x, type):
        return x.__name__
    return x


from ju import trait_to_py
from traitlets import Undefined
from i2 import Sig, Param


def signature_diffs(sig1, sig2, *, sig1_name='left', sig2_name='right'):
    """

    ```python

    from cosmograph.wip.config_properties import get_various_configs
    c = get_various_configs()

    ```
    """

    def _ensure_df(sig):
        if isinstance(sig, pd.DataFrame):
            return sig
        return sig_to_df(sig)

    df1, df2 = map(_ensure_df, (sig1, sig2))

    diffs = dataframe_diffs(df1, df2, ['index_diff', 'columns_value_diff'])

    if 'index_diff' in diffs:
        index_diff = diffs['index_diff']

        # rename left_right and right_left keys to sig1_name and sig2_name respectively
        # index_diff is a dict
        if 'left_right' in index_diff:
            index_diff[f"in_{sig1_name}__but_not_in_{sig2_name}"] = index_diff.pop(
                'left_right'
            )
        if 'right_left' in index_diff:
            index_diff[f"in_{sig2_name}__but_not_in_{sig1_name}"] = index_diff.pop(
                'right_left'
            )

    if 'columns_value_diff' in diffs:
        columns_value_diff = diffs['columns_value_diff']
        columns_value_diff['default'] = columns_value_diff['default'].rename(
            columns={'left': f'{sig1_name}', 'right': f'{sig2_name}'}
        )
        columns_value_diff['annotation'] = columns_value_diff['annotation'].rename(
            columns={'left': f'{sig1_name}', 'right': f'{sig2_name}'}
        )
        # apply _change_type_to_str to all values of the annotation column
        columns_value_diff['annotation'] = columns_value_diff['annotation'].map(
            _change_type_to_str
        )

    return diffs


from pprint import pprint


def print_signature_diffs(sig1, sig2, *, sig1_name='left', sig2_name='right'):
    """

    ```python

    from cosmograph.wip.config_properties import get_various_configs, get_sig_dfs, print_signature_diffs

    c = get_various_configs()
    sigs = get_sig_dfs(c)
    list(sigs)
    print_signature_diffs(sigs['traitlets'], sigs['widget_config_from_md'], sig1_name='traitlets', sig2_name='widget_config_from_md')

    ```
    """
    diffs = signature_diffs(sig1, sig2, sig1_name=sig1_name, sig2_name=sig2_name)
    for k, v in diffs.items():
        print(f"### {k}\n")
        if k == 'columns_value_diff':
            print('#### default\n')
            print_df(v['default'])
            print('\n')
            print('#### annotation\n')
            print_df(v['annotation'])
            print('\n')
        elif k == 'index_diff':
            for kk, vv in v.items():
                print(f"#### {kk}\n")
                pprint(vv)
                print('\n')
        else:
            if isinstance(v, pd.DataFrame):
                print_df(v)
            else:
                pprint(v)

        print('\n-----------------------------------------------------------------\n\n')


print_traitlet_and_ts_diffs = partial(
    print_signature_diffs,
    dacc.sig_dfs['traitlets'],
    dacc.sig_dfs['widget_config_from_ts'],
    sig1_name='traitlets',
    sig2_name='widget_config_from_ts',
)


print_traitlet_and_md_diffs = partial(
    print_signature_diffs,
    dacc.sig_dfs['traitlets'],
    dacc.sig_dfs['widget_config_from_md'],
    sig1_name='traitlets',
    sig2_name='widget_config_from_md',
)


# --------------------------------------------------------------------------------------
# A few utils


def to_int_or_float(x):
    "change strings that can be ints or floats, to ints or floats"
    if not isinstance(x, str):
        return x
    try:
        return int(x)
    except ValueError:
        try:
            return float(x)
        except ValueError:
            return x


def none_if_null(x):
    "change 'null' strings to None (that's how json serialization will work)"
    if isinstance(x, str) and x == 'null':
        return None
    return x


def tuple_if_list(x):
    "change lists and sets to tuples, because want immutable defaults"
    return tuple(x) if isinstance(x, (list, set)) else x


# --------------------------------------------------------------------------------------
# data objects required by some functions


parse_md_schema = {
    'name': 'whatevs',
    'strict': False,
    'schema': {
        'type': 'object',
        'properties': {
            'interfaces': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'name': {
                            'type': 'string',
                            'description': 'The name of the interface.',
                        },
                        'description': {
                            'type': 'string',
                            'description': 'A brief description of the interface (if available).',
                        },
                        'properties': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'name': {
                                        'type': 'string',
                                        'description': 'The name of the property within the interface.',
                                    },
                                    'type': {
                                        'type': 'string',
                                        'description': 'The type of the property.',
                                    },
                                    'description': {
                                        'type': 'string',
                                        'description': 'A brief description of the property (if available).',
                                    },
                                    'default': {
                                        'type': ['string', 'number', 'null'],
                                        'description': 'The default value for the property (if available).',
                                    },
                                    'group': {
                                        'type': ['string'],
                                        'description': 'The group to which the property belongs.',
                                    },
                                    'optional': {
                                        'type': 'boolean',
                                        'description': 'Indicates whether the property is optional.',
                                    },
                                },
                                'required': ['name', 'default'],
                            },
                        },
                    },
                    'required': ['name', 'properties'],
                },
            }
        },
    },
}
