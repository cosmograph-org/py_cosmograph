"""Define and acquire resources for the Cosmograph package."""

import os
from typing import Optional, Union
from functools import lru_cache, cached_property, partial

import pandas as pd

from dol import (
    cache_this,
    ensure_dir,
    TextFiles,
    add_extension,
    Files,
    filt_iter,
    wrap_kvs,
    written_bytes,
    read_from_bytes,
    Pipe,
)
from dol.filesys import mk_json_bytes_wrap
from i2 import postprocess


from cosmograph.util import data_dir_path, json_files, data_files


# -------------------------------------------------------------------------------------
# General utils


_json_wrap = mk_json_bytes_wrap(dumps_kwargs={'indent': 4})
JsonFiles = _json_wrap(TextFiles)  # TODO: should we add json filter? change name?

cache_to_json_files = partial(cache_this, cache=json_files, key=add_extension('json'))
resources_jsons = filt_iter.suffixes(['.json'])(JsonFiles(data_dir_path))


parquet_codec = wrap_kvs(
    value_encoder=written_bytes(pd.DataFrame.to_parquet, obj_arg_position_in_writer=0),
    value_decoder=read_from_bytes(pd.read_parquet),
)

parquet_files = parquet_codec(filt_iter.suffixes('.parquet')(data_files))
cache_to_parquet_files = partial(
    cache_this, cache=parquet_files, key=add_extension('parquet')
)


# -------------------------------------------------------------------------------------
# Getting official color names


@lru_cache
def _get_fresh_color_table():
    url = 'https://www.w3.org/TR/css-color-4/#named-colors'
    all_tables_of_page = pd.read_html(url)
    _color_table_columns = ['Color\xa0name', 'Hex\xa0rgb', 'Decimal']
    _is_color_table = lambda df: set(_color_table_columns).issubset(df.columns)
    if (color_table := next(filter(_is_color_table, all_tables_of_page), None)) is None:
        raise ValueError(
            f"Could not find the color table on the page with columns: {_color_table_columns}"
        )
    # clean up and normalize the column names
    color_table = color_table[_color_table_columns]
    color_table.columns = color_table.columns.map(
        lambda x: x.replace('\xa0', '_').lower()
    )
    assert color_table['color_name'].nunique() == len(
        color_table
    ), "color names are not unique"
    return color_table


# -------------------------------------------------------------------------------------


class ResourcesDacc:
    def __init__(self, resources_dir=data_dir_path) -> None:
        self.resources_dir = resources_dir
        self.resources_jsons = JsonFiles(self.resources_dir)
        self.resources_files = Files(self.resources_dir)

    @cache_to_parquet_files
    def _color_table(self):
        return _get_fresh_color_table()

    @cache_to_json_files
    def color_names(self):
        return self._color_table['color_name'].str.lower().tolist()

    @cached_property
    def color_names_set(self):
        return set(self.color_names)


resources_dacc = ResourcesDacc()

# -------------------------------------------------------------------------------------
# -------------------------------------------------------------------------------------
# Creating the configs source files from various sources
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

DFLT_CONFIG_FILES_DIR = data_dir_path
DFLT_CONFIG_PREP_DIR = os.path.join(DFLT_CONFIG_FILES_DIR, 'config_prep')

source_urls = {
    'cosmos/variables.ts': 'https://github.com/cosmograph-org/cosmos/blob/main/src/variables.ts',
    'cosmos/config.ts': 'https://github.com/cosmograph-org/cosmos/blob/next/src/config.ts',
    'cosmograph/config.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/config.ts',
    'cosmograph/data.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/data.ts',
    'cosmograph/labels.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/labels.ts',
    'cosmograph/simulation.ts': 'https://github.com/cosmograph-org/cosmograph/blob/dev/packages/cosmograph/src/cosmograph/config/simulation.ts',
    'cosmograph/configuration.mdx': 'https://github.com/cosmograph-org/cosmograph/blob/8c868898f256a207e12085a17566943bea49c28a/packages/website/pages/docs/v2/widget/configuration.mdx',
}

source_url_groups = {
    'defaults': ['cosmos/variables.ts'],
    'types': [
        'cosmos/config.ts',
        'cosmograph/config.ts',
        'cosmograph/data.ts',
        'cosmograph/labels.ts',
        'cosmograph/simulation.ts',
    ],
    'descriptions': ['cosmograph/configuration.mdx'],
}

# # Note:
# # For public urls, you just need to get a raw url, and download normally
# # But for private urls, you need to authenticate first, so we're not going to go the raw url route
# raw_file_url = partial(transform_github_url, target_url_type='raw_file')
# source_raw_urls = {k: raw_file_url(v) for k, v in source_urls.items()}

cache_to_config_jsons = partial(
    cache_this, cache='config_jsons', key=add_extension('json')
)
cache_to_prep_jsons = partial(cache_this, cache='prep_jsons', key=add_extension('json'))

from dol import flatten_dict
from i2.doc_mint import params_to_docstring
from i2 import Sig, Param

# TODO: Note, we need ju for config_dict_to_sig and for trait_to_py. Consider vendorizing config_dict_to_sig
from cosmograph._traitlets_util import trait_to_py  # vendorized from ju

EXCLUDE_PARAMS = ('_ipc_points', '_ipc_links')


def get_module_from_url(
    url, __file__: Optional[str] = None, module_name='remote_module'
):
    """
    Get a (loaded) module from a url.

    Note: The url has to be one whose text is the code of the module.
    This means, for example, if you're using github, that a normal github url won't work,
    your need to specify the raw url for the module.

    WARNING: This is a dangerous function, as it executes code from the url.
    Only use this if you trust the source of the url.
    """
    import requests
    import types

    response = requests.get(url)
    response.raise_for_status()
    code = response.text

    # Create a module and define the __file__ attribute before execution
    module = types.ModuleType(module_name)
    if __file__ is not None:
        module.__file__ = __file__
    exec(code, module.__dict__)

    return module


def get_cosmograph_widget_class(
    cosmograph_widget_source: Optional[Union[str, type]] = None
):

    if cosmograph_widget_source is None:
        # if no source is give, take the current (locally installed) cosmograph class
        from cosmograph_widget import Cosmograph
    elif isinstance(cosmograph_widget_source, type):
        Cosmograph = cosmograph_widget_source
    elif isinstance(
        cosmograph_widget_source, str
    ) and cosmograph_widget_source.startswith('http'):
        url = cosmograph_widget_source
        module_behind_url = get_module_from_url(
            url, __file__=__import__('cosmograph_widget').__file__
        )
        Cosmograph = getattr(module_behind_url, 'Cosmograph')
    else:
        raise ValueError(
            f"cosmograph_widget_source must be a class or a url string, not {cosmograph_widget_source}"
        )
    return Cosmograph


class ConfigsDacc:
    """
    A class to manage the various sources of Cosmograph configuration information.

    The class has methods to acquire the configuration information from various sources,
    parse these raw sources into dictionaries, diagnose and compare these, and finally
    generate a specification of the python cosmograph interfaces, including
    parameter/argument names, types, defaults, and descriptions.

    Note that many of these datas are cached into json files.
    That is, once they are calculated, they are saved into local json files, and
    the data is taken from there. To recompute these files, you can simply delete
    the json files in the `config_files_dir` or `prep_dir` directory and they
    will be recomputed as soon as they are accessed.

    Main methods and properties:

    - `matched_info_df`: A dataframe that shows the comparison of the defaults,
        descriptions, and types of the various sources.
    - `source_strings`: The raw source strings from the various sources.
    - `parsed_*`: The parsed versions of the raw sources.

    - `diagnosis_items`: A generator of diagnosis items, which are dataframes of
        duplicates or other issues found in the sources.
    - `print_diagnosis`: Print the diagnosis items.

    """

    # A few configuration options
    exclude_params_in_sig = EXCLUDE_PARAMS
    rm_default_if_nan_in_sig = False
    set_default_to_none_if_nan = True
    rm_param_if_no_description_in_sig = False
    take_name_of_types_in_docs = True

    def __init__(
        self,
        config_files_dir=DFLT_CONFIG_FILES_DIR,
        prep_dir=None,
        *,
        cosmograph_widget_source: Optional[Union[str, type]] = None,
    ) -> None:
        self.config_files_dir = os.path.abspath(os.path.expanduser(config_files_dir))
        self.prep_dir = prep_dir or os.path.join(self.config_files_dir, 'config_prep')
        ensure_dir(self.prep_dir, max_dirs_to_make=1)
        self.config_jsons = JsonFiles(self.config_files_dir)
        self.prep_jsons = JsonFiles(self.prep_dir)
        self.cosmograph_widget_source = cosmograph_widget_source

    @cache_to_prep_jsons
    def source_strings(self):
        from hubcap import (
            github_file_contents,
        )  # requires pip install hubcap (and set GITHUB_TOKEN env var)

        return {k: github_file_contents(v) for k, v in source_urls.items()}

    @cache_to_prep_jsons
    @postprocess(dict)
    def parsed_defaults(self):
        from jy import variable_declarations_pairs

        for k in source_url_groups['defaults']:
            yield k, dict(variable_declarations_pairs(self.source_strings[k]))

    @cache_to_prep_jsons
    @postprocess(dict)
    def parsed_descriptions(self):
        for k in source_url_groups['descriptions']:
            yield k, ai_md_parser(self.source_strings[k])

    @cache_to_prep_jsons
    @postprocess(dict)
    def parsed_types(self):
        for k in source_url_groups['types']:
            yield k, ai_ts_parser(self.source_strings[k])

    @cached_property
    def traitlets(self):
        from cosmograph_widget import Cosmograph
        from traitlets.traitlets import BaseDescriptor

        Cosmograph = get_cosmograph_widget_class(self.cosmograph_widget_source)
        return {
            k: v for k, v in vars(Cosmograph).items() if isinstance(v, BaseDescriptor)
        }

    @property
    def _defaults(self):
        return self.parsed_defaults['cosmos/variables.ts']

    @property
    def _descriptions(self):
        return self.parsed_descriptions['cosmograph/configuration.mdx']['interfaces'][
            0
        ]['properties']

    def _interfaces(self, *, assert_expected_keys=True):
        if assert_expected_keys:
            assert sorted(self.parsed_types) == [
                'cosmograph/config.ts',
                'cosmograph/data.ts',
                'cosmograph/labels.ts',
                'cosmograph/simulation.ts',
                'cosmos/config.ts',
            ], f"Not the keys I expected! If you want to ignore this, set assert_expected_keys=False"

        for widget_config_value in self.parsed_types.values():
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

    @property
    def defaults(self):
        """
        First, flattens the defaults dictionary, then transforms the keys to match
        traitlets keys.

        Steps:
        - Converts camelCase to snake_case.
        - Removes prefixes like 'default_'.
        - Maps specific terms (e.g., 'node' -> 'point', 'link' -> 'link').
        - Collapses nested structures by combining components.
        - takes care of edge cases

        Args:
            flat_defaults (dict): The flat dictionary of defaults.

        Returns:
            dict: A new dictionary with transformed keys.
        """
        flat_defaults = {
            camel_to_snake(k): v
            for k, v in flatten_dict(self._defaults, sep='_').items()
        }
        return transform_defaults_keys(flat_defaults)

    @property
    def _md_descriptions_df(self):
        """
        Dataframe of descriptions from the ("documentation") md file.
        """
        df = self.parsed_descriptions['cosmograph/configuration.mdx']['interfaces'][0][
            'properties'
        ]
        return pd.DataFrame(df).set_index('name')

    @property
    def _traitlets_df(self):
        """Dataframe of traitlets properties (only signature attributes)"""
        return sig_to_df(self.traitlets_sig)  # .set_index('name', drop=True)

    @property
    def _ts_types_df(self, *, assert_expected_keys=True, verbose=False):
        """
        Dataframe containing various features of properties extracted from the TS files.
        """
        # widget_config = json_files['_widget_config.json']

        interfaces = list(self._interfaces(assert_expected_keys=assert_expected_keys))
        # print(f"{len(interfaces)=}")

        # Solve all duplicates taking the CosmographConfig orgin_name

        def dedupper(name_group):
            if len(name_group) == 1:
                return name_group[0]
            elif (
                cosmo_config := next(
                    filter(
                        lambda x: x['origin_name'] == 'CosmographConfig', name_group
                    ),
                    None,
                )
                is not None
            ):
                return cosmo_config
            else:
                if verbose:
                    print(
                        f"Unresolved duplicate, I'll just take the first mention: {name_group=}"
                    )
                return name_group[0]

        # dedupped_interfaces = list(map(dedupper, interfaces))

        props_grouped_by_name = dict(
            find_duplicates(
                ((x['name'], x) for x in interfaces), val_filt=lambda x: True
            )
        )
        dedupped_interfaces = list(map(dedupper, props_grouped_by_name.values()))

        widget_config_properties = to_dict(dedupped_interfaces, 'py_name')

        assert len(widget_config_properties) == len(
            dedupped_interfaces
        ), f"widget_config had some duplicate properties"
        # print(f"{len(widget_config_properties)=}")
        return pd.DataFrame(widget_config_properties).T

    @cached_property
    def params_info(self):
        return {
            'defaults': self.defaults,
            'descriptions': self._md_descriptions,
            'types': self.parsed_types,
            'names': list(self._traitlets_df.index.values),
        }

    def _flat_keys_to_original_default_keys(self):
        from dol import leaf_paths

        original_defaults = self.parsed_defaults['cosmos/variables.ts']
        return {
            camel_to_snake(k): v
            for k, v in flatten_dict(leaf_paths(original_defaults), sep='_').items()
        }

    def info_dfs(self):
        """
        A dictionary of dataframes of the various sources of configuration information.
        """
        df = self._traitlets_df[['default', 'annotation']]
        # rename all columns to have a "traitlet_" prefix
        df = df.rename(columns={col: f"traitlet_{col}" for col in df.columns})
        yield 'traitlets', df

        # defaults
        yield 'defaults', pd.Series(self.defaults, name='defaults_default')

        # descriptions
        descriptions_df = self._md_descriptions_df.copy()
        # change "NO_DEFAULT" values of "default" column to NaNs
        descriptions_df['default'] = descriptions_df['default'].replace(
            'NO_DEFAULT', pd.NA
        )

        # rename all columns to have a "md_descriptions" prefix
        descriptions_df = descriptions_df.rename(
            columns={col: f"md_descriptions_{col}" for col in descriptions_df.columns}
        )
        yield 'descriptions', descriptions_df

        # types
        types_df = self._ts_types_df.copy()
        # rename all columns to have a "ts_types_" prefix
        types_df = types_df.rename(
            columns={col: f"ts_types_{col}" for col in types_df.columns}
        )
        yield 'types', types_df

    def cosmograph_base_params(self, param_names=None, *, kind=None):
        """
        Get the params information for the cosmograph base class.
        """

        param_names = param_names or list(self.traitlets)
        param_names = [
            x for x in param_names if x not in self.exclude_params_in_sig
        ]  # keeps order

        df = self.matched_info_df
        for name in param_names:
            d = {
                'name': name,
                'default': df.defaults_default.get(name),
                'annotation': df.traitlet_annotation.get(name),
                'description': df.md_descriptions_description.get(name),
            }
            if kind:
                d['kind'] = kind
            if (
                self.rm_param_if_no_description_in_sig
                and d['description'] is pd.NA
                or not d['description']
            ):
                continue  # without yielding d
            if isinstance(d['default'], float) and pd.isna(d['default']):
                if self.set_default_to_none_if_nan:
                    d['default'] = None
                elif self.rm_default_if_nan_in_sig:
                    del d['default']
            yield d

    def cosmograph_base_params_json(self):
        from cosmograph.util import annotation_to_str

        params = pd.DataFrame(list(self.cosmograph_base_params()))
        params['description'] = params['description'].fillna('')
        params['annotation'] = params['annotation'].apply(annotation_to_str)
        return params.to_json(orient='records', indent=4)

    def cosmograph_base_docs(self, param_names=None):
        """Get the params information part of a docstring"""
        params = self.cosmograph_base_params(param_names)
        return params_to_docstring(
            params, take_name_of_types=self.take_name_of_types_in_docs
        )

    def cosmograph_base_signature(self):
        params = self.cosmograph_base_params(kind=Sig.KEYWORD_ONLY)

        def prep_for_param(d):
            d = d.copy()
            if d.get('annotation') is None:
                del d['annotation']
            del d['description']
            return d

        return Sig([Param(**prep_for_param(d)) for d in params])

    @property
    def matched_info_df(self):
        from cosmograph.util import move_to_front

        front_cols = [
            'traitlet_annotation',
            'defaults_default',
            'ts_types_default',
            'md_descriptions_default',
            'md_descriptions_description',
            'ts_types_description',
            'ts_types_type',
        ]

        info_dfs = dict(self.info_dfs())

        merge_dfs = partial(pd.merge, left_index=True, right_index=True, how='left')

        df = info_dfs.pop("traitlets")

        for k, v in info_dfs.items():
            df = merge_dfs(df, v)

        return move_to_front(df, front_cols)

    def matched_info_df_prepared_for_export(self):
        t = self.matched_info_df.fillna("")
        t['traitlet_annotation'] = t['traitlet_annotation'].apply(
            lambda x: x.__name__ if isinstance(x, type) else x
        )
        t.columns = t.columns.str.replace('_', ' ')
        return t

        # # traitlets data

        # df = self._traitlets_df[['default', 'annotation']]
        # # rename all columns to have a "traitlet_" prefix
        # df = df.rename(columns={col: f"traitlet_{col}" for col in df.columns})

        # # merge in defaults (but keep all traitlets)
        # df = df.merge(
        #     pd.Series(self.defaults, name='defaults_default'),
        #     left_index=True,
        #     right_index=True,
        #     how='left',
        # )

        # # md descriptions source
        # descriptions_df = self._md_descriptions_df.copy()
        # # rename all columns to have a "md_descriptions" prefix
        # descriptions_df = descriptions_df.rename(
        #     columns={col: f"md_descriptions_{col}" for col in descriptions_df.columns}
        # )
        # df = df.merge(
        #     descriptions_df,
        #     left_index=True,
        #     right_index=True,
        #     how='left',
        # )

        # # ts types source
        # types_df = self._ts_types_df.copy()
        # # rename all columns to have a "ts_types_" prefix
        # types_df = types_df.rename(
        #     columns={col: f"ts_types_{col}" for col in types_df.columns}
        # )
        # # merge (but keep all traitlets)
        # df = df.merge(
        #     types_df,
        #     left_index=True,
        #     right_index=True,
        #     how='left',
        # )

        # return move_to_front(df, front_cols)

    @cached_property
    def traitlets_sig(self):
        py_annotations = {k: trait_to_py(v) for k, v in self.traitlets.items()}
        py_defaults = {
            k: getattr(v, 'default_value', Undefined) for k, v in self.traitlets.items()
        }
        param_dicts = [
            {
                'name': name,
                'kind': Sig.KEYWORD_ONLY,
                'annotation': py_annotations[name],
                'default': py_defaults[name],
            }
            for name in self.traitlets
        ]

        return Sig([Param(**d) for d in param_dicts])


    # TODO: Might be an old one. Consider deleting! No widget_config_from_ts attr
    #    Find its definition in ConfigSourceDicts class
    # @cached_property
    # def sig_dfs(self):
    #     from traitlets import Undefined
    #     from i2 import Sig, Param

    #     widget_config_from_ts_sig = config_dict_to_sig(self.widget_config_from_ts)
    #     widget_config_from_md_sig = config_dict_to_sig(self.widget_config_from_md)

    #     return {
    #         'traitlets': sig_to_df(self.traitlets_sig),
    #         'widget_config_from_ts': sig_to_df(widget_config_from_ts_sig),
    #         'widget_config_from_md': sig_to_df(widget_config_from_md_sig),
    #     }

    # ----------------------------------------------------------------------------------
    # DIAGNOSIS

    def print_traitlet_and_ts_diffs(self):
        print_traitlet_and_ts_diffs()

    def print_traitlet_and_md_diffs(self):
        print_traitlet_and_md_diffs()

    def diagnosis_items(self):
        t = self._duplicates_of_types_group()
        if t:
            t = pd.DataFrame({k: [x['origin_name'] for x in v] for k, v in t.items()}).T
            yield "Duplicates of types group", t
        # TODO: add more (e.g. source differences defaults, descriptions, etc.)

    def print_diagnosis(self):
        for k, v in self.diagnosis_items():
            if isinstance(v, pd.DataFrame):
                print(f"\n{k}:\n")
                print(v.to_string())

    def _duplicates_of_types_group(
        self, key_field='name', *, assert_expected_keys=True
    ):
        name_and_value_pairs = ((x[key_field], x) for x in self._interfaces())
        return find_duplicates(name_and_value_pairs, val_filt=lambda x: len(x) > 1)


configs_dacc = ConfigsDacc()

import re
from dol import flatten_dict

extra_default_key_to_traitlet_mapping = {
    'greyout_point_opacity': 'point_greyout_opacity',
    'hovered_point_ring_opacity': 'render_hovered_point_ring',  # Or add 'hovered_point_ring_opacity' if missing
    'greyout_link_opacity': 'link_greyout_opacity',
    'focused_point_ring_opacity': 'focused_point_ring_color',  # Or add 'focused_point_ring_opacity' if missing
    'scale_to_zoom': 'initial_zoom_level',
    'arrow_links': 'default_link_arrows',
    'arrow_size_scale': 'link_arrows_size_scale',
}


def transform_defaults_keys(flat_defaults):
    """
    Transforms the keys of the flat defaults dictionary to match traitlets keys.

    Steps:
    - Converts camelCase to snake_case.
    - Removes prefixes like 'default_'.
    - Maps specific terms (e.g., 'node' -> 'point', 'link' -> 'link').
    - Collapses nested structures by combining components.

    Args:
        flat_defaults (dict): The flat dictionary of defaults.

    Returns:
        dict: A new dictionary with transformed keys.
    """
    transformed = {}

    for key, value in flat_defaults.items():
        # Step 1: Convert camelCase to snake_case
        key_snake = camel_to_snake(key)

        # Step 2: Remove "default_" prefix if present
        if key_snake.startswith("default_"):
            key_snake = key_snake[len("default_") :]

        # Step 3: Handle nested prefixes
        key_snake = key_snake.replace("config_values_", "")

        # Step 4: Map specific terms to align with traitlets keys
        key_snake = key_snake.replace("node", "point")  # Map 'node' to 'point'
        key_snake = key_snake.replace(
            "link_visibility_", "link_visibility_"
        )  # Ensure key clarity

        # Handle FPS capitalization edge case
        key_snake = key_snake.replace("show_fps_monitor", "show_FPS_monitor")

        if key_snake in extra_default_key_to_traitlet_mapping:
            key_snake = extra_default_key_to_traitlet_mapping[key_snake]

        # Step 5: Store the transformed key and its corresponding value
        transformed[key_snake] = value

    return transformed


import re

# Compiled regex to handle camel case to snake case conversions, including acronyms
_camel_to_snake_re = re.compile(r'((?<=[a-z0-9])[A-Z]|(?!^)[A-Z](?=[a-z]))')


def camel_to_snake(camel_string):
    """
    Convert a CamelCase string to snake_case. Useful for converting class
    names to variable names.

    Args:
        camel_string (str): The CamelCase string to convert.

    Returns:
        str: The converted snake_case string.

    Examples:
        >>> camel_to_snake('BasicParseTest')
        'basic_parse_test'
        >>> camel_to_snake('HTMLParser')
        'html_parser'
        >>> camel_to_snake('CamelCaseExample')
        'camel_case_example'

        Note that acronyms are handled correctly:

        >>> camel_to_snake('XMLHttpRequestTest')
        'xml_http_request_test'
    """
    return _camel_to_snake_re.sub(r'_\1', camel_string).lower()


# --------------------------------------------------------------------------------------
# Parsing Typescript (with AI)

from functools import partial
from dol import Pipe


def parse_ts_with_oa(*args, **kwargs):
    from jy.ts_parse import parse_ts_with_oa as _parse_ts_with_oa

    return _parse_ts_with_oa(*args, **kwargs)


def grammar_ts_parser(*args, **kwargs):
    """ts parser based on grammar.
    I'd prefer to use this one, but it's not complete enough for our purposes (yet).
    """
    from jy.ts_parse import parse_ts as _parse_ts

    return _parse_ts(*args, **kwargs)


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
    """Group (k, v) items by k and filter the resulting grouped list of values

    >>> gather_items([('a', 1), ('b', 2), ('a', 3)], val_filt=lambda x: len(x) > 1)
    {'a': [1, 3]}

    """
    d = defaultdict(list)
    for key, value in pairs:
        d[key].append(value)
    return {k: v for k, v in d.items() if val_filt(v)}


find_duplicates = partial(gather_items, val_filt=lambda x: len(x) > 1)


def to_dict(iterable, key_field: str):
    """Convert an iterable of dictionaries to a dictionary of dictionaries

    >>> to_dict([{'a': 1, 'b': 2}, {'a': 3, 'b': 4}], 'a')
    {1: {'a': 1, 'b': 2}, 3: {'a': 3, 'b': 4}}

    """
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



# --------------------------------------------------------------------------------------
# TODO: might want to deprecate much of the below

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

    # def save_sots(self):
    #     from cosmograph.util import json_files

    #     save_sots(self.sig_and_doc_info)

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


import pandas as pd
from i2.signatures import parameter_to_dict
from dol import Pipe


def config_dict_to_sig(config_dict):
    import ju

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


from traitlets import Undefined
from i2 import Sig, Param


def signature_diffs(sig1, sig2, *, sig1_name='left', sig2_name='right'):
    """

    ```python

    from cosmograph.wip.config_properties import get_various_configs
    c = get_various_configs()

    ```
    """
    from tabled import dataframe_diffs

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
