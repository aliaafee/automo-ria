from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response
from .item_getters import get_items_list, get_item, post_item


@api.route("/addresses/")
def get_addresses():
    return get_items_list(md.Address, 'api.get_addresses')


@api.route("/addresses/<int:address_id>")
def get_address(address_id):
    return get_item(md.Address, address_id)


@api.route("/addresses/<int:address_id>", methods=['POST'])
def post_address(address_id):
    return post_item(md.Address, address_id)


def get_patient_address(patient_id, address_type):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    address = getattr(patient, address_type)

    if address is None:
        return errors.resource_not_found("Patient with id {}, no {}.".format(patient_id, address_type))

    data = address.get_serialized()

    return jsonify(data)


def post_patient_address(patient_id, address_type):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    data = request.get_json()

    address = getattr(patient, address_type)

    if address is None:
        address = md.Address()

    try:
        address.validate_and_update_data(data)
    except md.dbexception.FieldValueError as e:
        return errors.invalid_fields(e.invalid_fields)

    setattr(patient, address_type, address)

    db.session.commit()

    return success_response("Address Saved")

    
@api.route("/patients/<int:patient_id>/current-address")
def get_patient_current_address(patient_id):
    return get_patient_address(patient_id, 'current_address')


@api.route("/patients/<int:patient_id>/permanent-address")
def get_patient_permanent_address(patient_id):
    return get_patient_address(patient_id, 'permanent_address')


@api.route("/patients/<int:patient_id>/current-address", methods=['POST'])
def post_patient_current_address(patient_id):
    return post_patient_address(patient_id, 'current_address')


@api.route("/patients/<int:patient_id>/permanent-address", methods=['POST'])
def post_patient_permanent_address(patient_id):
    return post_patient_address(patient_id, 'permanent_address')



