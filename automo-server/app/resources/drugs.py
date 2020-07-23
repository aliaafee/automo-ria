from sqlalchemy import or_, and_
from flask import request

from .. import models as md

from . import api
from .item_getters import get_items_list, get_item, post_item, get_query_result


@api.route("/drugs/")
def get_drugs():
    str_search = request.args.get('q', "", type=str)
    str_starts_with = request.args.get('s', "", type=str)

    query_result = md.Drug.query

    if str_starts_with:
        query_result = query_result.filter(md.Drug.name.like("{}%".format(str_starts_with)))

    if str_search:
        and_filters = []
        for word in str_search.split():
            if word:
                and_filters.append(md.Drug.name.like("%{}%".format(word)))

        query_result = query_result.filter(and_(*and_filters))

    query_result.order_by(md.Drug.name)
    
    api_route_values = {}
    if str_search != "":
        api_route_values['q'] = str_search
    
    return get_query_result(
        query_result,
        'api.get_drugs',
        api_route_values=api_route_values
    )