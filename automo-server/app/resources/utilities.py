
from . import errors
from flask import request, url_for


def paginate_query(query_result, fields=None, get_arg_names=[]):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    get_args = {}
    for arg_name in get_arg_names:
        value = request.args.get(arg_name, None)
        if value:
            get_args[arg_name] = value

    print(request.endpoint)

    if per_page > 100:
        per_page = 100

    pagination = query_result.paginate(
        page, per_page=per_page, error_out=False
    )

    items = pagination.items

    prev = None
    if pagination.has_prev:
        prev = url_for(request.endpoint, page=page-1, per_page=per_page, _external=True, **get_args)

    next = None
    if pagination.has_next:
        next = url_for(request.endpoint, page=page+1, per_page=per_page, _external=True,  **get_args)

    items_list = []
    for item in items:
        items_list.append(item.get_serialized(fields))

    if not items_list:
        return errors.resource_not_found("Items not found.")

    return {
        'items': items_list,
        'prev': prev,
        'next': next,
        'count': pagination.total
    } 