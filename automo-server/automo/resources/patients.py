from flask import url_for, jsonify, g, request
from flask_restful import Resource

from sqlalchemy_continuum import version_class

from .. import models as md
from .. import db

from . import api
from .authentication import auth
from . import errors
from .success import success_response


@api.route("/patients/")
def get_patients():
    page = request.args.get('page', 1, type=int)
    pagination = md.Patient.query.paginate(
        page, per_page=20, error_out=False
    )
    patients = pagination.items
    prev = None
    if pagination.has_prev:
        prev = url_for('api.get_patients', page=page-1, _external=True)
    next = None
    if pagination.has_next:
        next = url_for('api.get_patients', page=page+1, _external=True)

    patient_list = []
    for patient in patients:
        patient_list.append({
            'id': patient.id,
            'hospital_no': patient.hospital_no,
            'name': patient.name,
            'sex': patient.sex,
            'time_of_birth': patient.time_of_birth,
            'url' : url_for('api.get_patient', patient_id=patient.id, _external=True)
        })

    return jsonify({
        'patients': patient_list,
        'prev': prev,
        'next': next,
        'count': pagination.total
    })


@api.route("/patients/<int:patient_id>")
def get_patient(patient_id):
    patient = md.Patient.query.get_or_404(patient_id)

    data = patient.get_serialized()

    data['encounters'] = url_for('api.get_patient_encounters', patient_id=patient.id, _external=True)

    return jsonify(data)


@api.route("/patients/<int:patient_id>", methods=['POST'])
def post_patient(patient_id):
    patient = md.Patient.query.get_or_404(patient_id)

    data = request.get_json()

    invalid_fields = []
    for key in data:
        if not patient.is_valid_attr(key, data[key]):
            invalid_fields.append(key)

    if invalid_fields:
        #return errors.unprocessable(", ".join(invalid_fields))
        return errors.invalid_fields(invalid_fields)

    for key in data:
        patient.setattr(key, data[key])

    db.session.commit()

    return success_response("Patient Saved")

"""
@api.route("/patients/<int:patient_id>/versions/")
def patient_versions(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    versions = patient.versions

    result = {}
    for version in versions:
        result[version.transaction_id] = {
            "url" : url_for('api.patient_version',patient_id=patient.id,
                            transaction_id=version.transaction_id, _external=True)
        }

    return jsonify(result)   


@api.route("/patients/<int:patient_id>/versions/<int:transaction_id>")
def patient_version(patient_id, transaction_id):
    PatientVersion = version_class(md.Patient)

    patient_version = PatientVersion.query.filter_by(id=patient_id, transaction_id=transaction_id).first()

    if patient_version is None:
        return errors.resource_not_found("Version not found.".format(patient_id))

    data = md.Patient.get_serialized(patient_version, md.Patient.serialized_attrs)

    return jsonify(data)


@api.route("/patients/<int:patient_id>/versions/<int:transaction_id>/transaction")
def patient_version_transaction(patient_id, transaction_id):
    PatientVersion = version_class(md.Patient)

    patient_version = PatientVersion.query.filter_by(id=patient_id, transaction_id=transaction_id).first()

    if patient_version is None:
        return errors.resource_not_found("Version not found.".format(patient_id))

    transaction = patient_version.transaction

    result = {
        'id' : transaction.id,
        'issued_at': transaction.issued_at,
        'user' : url_for('api.user',username=transaction.user.username, _external=True),
        'remote_addr': transaction.remote_addr
    }

    return jsonify(result)
"""