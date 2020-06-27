"""Generic functions for getting items"""
from sqlalchemy import inspect, exc
from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import errors
from .success import success_response


def get_query_result(query, api_route, fields=None, api_route_values={}):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    if per_page > 100:
        per_page = 100

    pagination = query.paginate(
        page, per_page=per_page, error_out=False
    )
    items = pagination.items
    
    prev = None
    if pagination.has_prev:
        prev = url_for(api_route, page=page-1, per_page=per_page, _external=True, **api_route_values)

    next = None
    if pagination.has_next:
        next = url_for(api_route, page=page+1, per_page=per_page, _external=True,  **api_route_values)

    items_list = []
    for item in items:
        items_list.append(item.get_serialized(fields))

    if not items_list:
        return errors.resource_not_found("Items not found.")

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
        return errors.resource_not_found("Item not found.")

    data = request.get_json()

    try:
        result = item.validate_and_update(data)
        
        if result:
            db.session.rollback()
            return errors.invalid_fields(result)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Databse Error: {}".format(e))

    return item.get_serialized(data.keys())


def get_items_list(model, api_route, fields=None):
    return get_query_result(model.query, api_route, fields=fields)


def get_item(model, item_id, fields=None, additional_data={}, id_field_name='id'):
    return get_one_query_result(
        model.query.filter_by(**{id_field_name:item_id}),
        fields,
        additional_data)



def post_item(model, item_id):
    return post_one_query_result(
        model.query.filter_by(id=item_id)
    )


def new_item(model):
    item = model()

    data = request.get_json()

    try:
        result = item.validate_and_insert(data)
        
        if result:
            db.session.rollback
            return errors.invalid_fields(result)

        db.session.add(item)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Databse Error: {}".format(e))

    attrs = [inspect(model).primary_key[0].name]
    attrs.extend(data.keys())

    return item.get_serialized(data.keys())




def problems_data_to_problems(data):
    item_class = md.Problem
    processed_items = []
    invalid_items = []

    for item_data in data:
        item_id = item_data.pop('id', None)

        icd10class_data = item_data.pop('icd10class', None)
        if icd10class_data:
            item_data['icd10class_code'] = icd10class_data.pop('code', None)

        icd10modifier_class_data = item_data.pop('icd10modifier_class', None)
        if icd10modifier_class_data:
            item_data['icd10modifier_class_code'] = icd10modifier_class_data.pop('code', None)

        icd10modifier_extra_class_data = item_data.pop('icd10modifier_extra_class', None)
        if icd10modifier_class_data:
            item_data['icd10modifier_extra_class_code'] = icd10modifier_extra_class_data.pop('code', None)

        if item_id is None:
            new_item = item_class()

            invalid_fields = new_item.validate_and_insert(item_data)
            if invalid_fields:
                invalid_items.append(invalid_fields)
            else:
                processed_items.append(new_item)

        else:
            existing_item = item_class.query.get(item_id)
            if existing_item is None:
                invalid_items.append({'id': 'Item not found'})
            else:
                processed_items.append(existing_item)

    if invalid_items:
        raise md.dbexception.FieldValueError('Invalid fields', invalid_items)

    return processed_items
