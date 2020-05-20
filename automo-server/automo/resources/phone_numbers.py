from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response
from .item_getters import get_query_result, get_one_query_result, post_one_query_result


@api.route("/patients/<int:patient_id>/phone-numbers/")
def get_patient_phone_numbers(patient_id):
    return get_query_result(
        md.PhoneNumber.query.filter_by(patient_id=patient_id),
        'api.get_patient_phone_numbers'
    )


@api.route("/patients/<int:patient_id>/phone-numbers/<int:phone_number_id>")
def get_patient_phone_number(patient_id, phone_number_id):
    return get_one_query_result(
        md.PhoneNumber.query.filter_by(id=phone_number_id, patient_id=patient_id)
    )


@api.route("/patients/<int:patient_id>/phone-numbers/<int:phone_number_id>", methods=['POST'])
def post_patient_phone_number(patient_id, phone_number_id):
    return post_one_query_result(
        md.PhoneNumber.query.filter_by(id=phone_number_id, patient_id=patient_id)
    )
