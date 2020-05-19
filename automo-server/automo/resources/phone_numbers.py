from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response


@api.route("/phone-numbers/<int:phone_number_id>")
def get_phone_number(phone_number_id):
    phone_number = md.PhoneNumber.query.get(phone_number_id)

    if phone_number is None:
        return errors.resource_not_found("Phone Number with id {} not found.".format(phone_number_id))

    data = phone_number.get_serialized()

    return jsonify(data)


@api.route("/phone-numbers/<int:address_id>", methods=['POST'])
def post_phone_number(address_id):
    phone_number = md.PhoneNumber.query.get(address_id)

    if phone_number is None:
        return errors.resource_not_found("Phone Number with id {} not found.".format(address_id))

    data = request.get_json()

    try:
        phone_number.validate_and_setdata(data)
    except md.dbexception.FieldValueError as e:
        return errors.invalid_fields(e.invalid_fields)

    db.session.commit()

    return success_response("Phone Number Saved")