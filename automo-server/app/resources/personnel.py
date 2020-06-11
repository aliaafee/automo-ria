from flask import url_for, request
from .. import models as md

from . import api
from .item_getters import get_items_list, get_item, post_item, get_query_result, get_one_query_result, post_one_query_result


@api.route("/personnel/")
def get_personnel():
    query = md.Personnel.query

    personnel_type = request.args.get('type', None)

    if personnel_type:
        query = query.filter_by(type=personnel_type)

    return get_query_result(
        query,
        'api.get_personnel',
        api_route_values={
            'personnel_type': personnel_type
        }
    )


@api.route("/personnel/<int:personnel_id>")
def get_personnel_one(personnel_id):
    return get_item(md.Personnel, personnel_id)

"""
@api.route("/personnel/<personnel_type>/")
def get_personnel_type(personnel_type):
    query = md.Personnel.query.filter_by(type=personnel_type)

    return get_query_result(
        query,
        'api.get_personnel_type',
        api_route_values={
            'personnel_type':personnel_type
        }
    )
"""