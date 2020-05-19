"""Generic functions for getting items"""
from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import errors
from .success import success_response


def get_items_list(model, api_route, fields=None):
    page = request.args.get('page', 1, type=int)
    pagination = model.query.paginate(
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


def get_item(model, item_id, fields=None):
    item = model.query.get(item_id)

    if item is None:
        return errors.resource_not_found("Item with id {} not found.".format(item_id))

    data = item.get_serialized(fields)

    return jsonify(data)


def post_item(model, item_id):
    item = model.query.get(item_id)

    if item is None:
        return errors.resource_not_found("Item with id {} not found.".format(item_id))

    data = request.get_json()

    try:
        item.validate_and_setdata(data)
    except md.dbexception.FieldValueError as e:
        return errors.invalid_fields(e.invalid_fields)

    db.session.commit()

    return success_response("Item saved")
