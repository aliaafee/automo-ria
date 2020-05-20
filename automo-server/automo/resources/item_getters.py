"""Generic functions for getting items"""
from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import errors
from .success import success_response


def get_query_result(query, api_route, fields=None):
    page = request.args.get('page', 1, type=int)
    pagination = query.paginate(
        page, per_page=20, error_out=False
    )
    items = pagination.items
    
    prev = None
    if pagination.has_prev:
        prev = url_for(api_route, page=page-1, _external=True)

    next = None
    if pagination.has_next:
        next = url_for(api_route, page=page+1, _external=True)

    items_list = []
    for item in items:
        items_list.append(item.get_serialized(fields))

    return jsonify({
        'items': items_list,
        'prev': prev,
        'next': next,
        'count': pagination.total
    })


def get_one_query_result(query, fields=None, additional_data={}):
    item = query.first()

    if item is None:
        return errors.resource_not_found("Item not found.")

    data = item.get_serialized(fields)
    data.update(additional_data)

    return jsonify(data)


def post_one_query_result(query):
    item = query.first()

    if item is None:
        return errors.resource_not_found("Item with not found.")

    data = request.get_json()

    try:
        item.validate_and_setdata(data)
    except md.dbexception.FieldValueError as e:
        return errors.invalid_fields(e.invalid_fields)

    db.session.commit()

    return success_response("Item saved")


def get_items_list(model, api_route, fields=None):
    return get_query_result(model.query, api_route, fields)


def get_item(model, item_id, fields=None, additional_data={}):
    return get_one_query_result(
        model.query.filter_by(id=item_id),
        fields,
        additional_data)



def post_item(model, item_id):
    return post_one_query_result(
        model.query.filter_by(id=item_id)
    )

