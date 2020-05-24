from sqlalchemy import or_
from flask import url_for, jsonify, g, request
from flask_restful import Resource

from sqlalchemy_continuum import version_class

from .. import models as md
from .. import db

from . import api
from .authentication import auth
from . import errors
from .success import success_response
from .item_getters import get_items_list, get_item, post_item, get_query_result


@api.route("/patients/")
def get_patients():
    str_search = request.args.get('q', "", type=str)

    query_result = md.Patient.query.filter(
                or_(
                    or_(
                        md.Patient.hospital_no.like("%{0}%".format(str_search)),
                        md.Patient.national_id_no.like("%{0}%".format(str_search))
                    ),
                    md.Patient.name.like("%{}%".format(str_search))
                )
            )

    return get_query_result(
        query_result,
        'api.get_patients',
        fields=[
            'id',
            'hospital_no',
            'national_id_no',
            'name',
            'sex',
            'age'
        ],
        api_route_values={
            'q': str_search
        }
    )


    """
    return get_items_list(
        md.Patient,
        'api.get_patients',
        fields=[
            'id',
            'hospital_no',
            'name',
            'sex',
            'age'
        ]
    )
    """


@api.route("/patients/<int:patient_id>")
def get_patient(patient_id):
    return get_item(
        md.Patient,
        patient_id,
        additional_data={
            'encounters': url_for('api.get_patient_encounters', patient_id=patient_id, _external=True),
            'problems': url_for('api.get_patient_problems', patient_id=patient_id, _external=True),
            'admissions': url_for('api.get_patient_admissions', patient_id=patient_id, _external=True)
        }
    )


@api.route("/patients/<int:patient_id>", methods=['POST'])
def post_patient(patient_id):
    return post_item(
        md.Patient,
        patient_id
    )


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