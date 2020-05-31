from sqlalchemy import or_, and_
from flask import request

from .. import models as md

from . import api
from .item_getters import get_items_list, get_item, post_item, get_query_result


@api.route("/icd10/categories/")
def get_icd10_categories():
    str_search = request.args.get('q', "", type=str)
    str_parent_block_code = request.args.get('block', "", type=str)
    bool_detailed = request.args.get('detailed', False, type=bool)

    query_result = md.Icd10Class.query

    if str_parent_block_code != "":
        query_result = query_result.filter(md.Icd10Class.parent_block_code == str_parent_block_code)

    and_filters = []

    if str_search:
        for word in str_search.split():
            if word:
                and_filters.append(md.Icd10Class.preferred_plain.like("%{}%".format(word)))

    query_result = query_result.filter(md.Icd10Class.kind == "category").filter(
        or_(
            md.Icd10Class.code.like("%{0}%".format(str_search)),
            and_(
                *and_filters
            )
        )
    )

    if bool_detailed:
        fields = [
            'code',
            'kind',
            'preferred_plain',
            'preferred',
            'preferred_long',
            'inclusion',
            'exclusion',
            'text',
            'note',
            'coding_hint',
            'usage',
            'modifier_code',
            'modifier',
            'modifier_extra_code',
            'modifier_extra',
            'parent_code',
            'chapter_code',
            'parent_block_code'
        ]
    else:
        fields = [
            'code',
            'preferred_plain',
            'parent_block_code',
            'modifier',
            'modifier_extra'
        ]

    api_route_values = {}
    if str_search != "":
        api_route_values['q'] = str_search
    if str_parent_block_code != "":
        api_route_values['block'] = str_parent_block_code
    if bool_detailed:
        api_route_values['detailed'] = bool_detailed

    return get_query_result(
        query_result,
        'api.get_icd10_categories',
        fields=fields,
        api_route_values=api_route_values
    )


@api.route("icd10/categories/<code>")
def get_icd10_category(code):
    return get_item(
        md.Icd10Class,
        code,
        id_field_name='code',
        fields={
            'code',
            'kind',
            'preferred_plain',
            'preferred',
            'preferred_long',
            'inclusion',
            'exclusion',
            'text',
            'note',
            'coding_hint',
            'usage',
            'modifier_code',
            'modifier',
            'modifier_extra_code',
            'modifier_extra',
            'parent_code',
            'chapter_code',
            'parent_block_code'
        }
    )


@api.route("icd10/modifierclasses/")
def get_icd10_modifier_classes():
    modifier_code = request.args.get('modifier_code', "", type=str)

    query_result = md.Icd10ModifierClass.query
    
    if modifier_code != "":
        query_result = query_result.filter(md.Icd10ModifierClass.modifier_code == modifier_code)

    return get_query_result(
        query_result,
        'api.get_icd10_modifier_classes',
        fields=[
            'code',
            'code_short',
            'preferred'
        ],
        api_route_values={
            'modifier_code': modifier_code
        }
    )