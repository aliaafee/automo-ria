from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response
from .item_getters import get_items_list, get_item, post_item, get_one_query_result, post_one_query_result


@api.route("/addresses/")
def get_addresses():
    return get_items_list(md.Address, 'api.get_addresses')


@api.route("/addresses/<int:address_id>", methods=['GET', 'POST'])
def get_address(address_id):
    if request.method == 'POST':
        return post_item(md.Address, address_id)
    
    return get_item(md.Address, address_id)


@api.route("/patients/<int:patient_id>/current-address", methods=['GET', 'POST'])
def get_patient_current_address(patient_id):
    result = md.Address.query.join(
        md.Patient, md.Address.id == md.Patient.current_address_id
        ).filter(
            md.Patient.id == patient_id
        )

    if request.method == 'POST':
        post_one_query_result(result)

    return get_one_query_result(result)


@api.route("/patients/<int:patient_id>/permanent-address", methods=['GET', 'POST'])
def get_patient_permanent_address(patient_id):
    result = md.Address.query.join(
        md.Patient, md.Address.id == md.Patient.permanent_address_id
        ).filter(
            md.Patient.id == patient_id
        )

    if request.method == 'POST':
        post_one_query_result(result)

    return get_one_query_result(result)
