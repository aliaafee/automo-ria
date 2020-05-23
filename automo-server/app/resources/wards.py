from flask import url_for
from .. import models as md

from . import api
from .item_getters import get_items_list, get_item, post_item, get_query_result, get_one_query_result, post_one_query_result


@api.route("/wards/")
def get_wards():
    return get_items_list(md.Ward, 'api.get_wards')


@api.route("/wards/<int:ward_id>")
def get_ward(ward_id):
    return get_item(
        md.Ward,
        ward_id,
        additional_data={
            'beds': url_for('api.get_ward_beds', ward_id=ward_id, _external=True)
        }
    )


@api.route("/wards/<int:ward_id>", methods=['POST'])
def post_ward(ward_id):
    return post_item(md.Ward, ward_id)


@api.route("wards/<int:ward_id>/beds/")
def get_ward_beds(ward_id):
    return get_query_result(
        md.Bed.query.filter_by(ward_id=ward_id),
        'api.get_ward_beds',
        api_route_values={
            'ward_id': ward_id
        }
    )


@api.route("wards/<int:ward_id>/beds/<int:bed_id>")
def get_ward_bed(ward_id, bed_id):
    return get_one_query_result(
        md.Bed.query.filter_by(id=bed_id, ward_id=ward_id)
    )


@api.route("wards/<int:ward_id>/beds/<int:bed_id>", methods=['POST'])
def post_ward_bed(ward_id, bed_id):
    return post_one_query_result(
        md.Bed.query.filter_by(id=bed_id, ward_id=ward_id)
    )
