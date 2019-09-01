from flask import url_for, jsonify, g
from flask_restful import Resource

from sqlalchemy_continuum import version_class

from .. import models as md
from .. import db

from . import api
from .authentication import auth
from . import errors


@api.route("/patients/")
@auth.login_required
def patients():
    patients = md.Patient.query.all()

    result = {}
    for patient in patients:
        result[patient.id] = {
            'uri' : url_for('api.patient',patient_id=patient.id)
        }

    return jsonify(result)


@api.route("/patients/<int:patient_id>")
@auth.login_required
def patient(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    result = {
        'id' : patient.id,
        'name' : patient.name,
        'versions' : url_for('api.patient_versions', patient_id=patient.id),
    }
    
    return jsonify(result)


@api.route("/patients/<int:patient_id>/versions")
@auth.login_required
def patient_versions(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    versions = patient.versions

    result = {}
    for version in versions:
        result[version.transaction_id] = {
            "url" : url_for('api.patient_version',patient_id=patient.id,
                            transaction_id=version.transaction_id)
        }

    return jsonify(result)   


@api.route("/patients/<int:patient_id>/versions/<int:transaction_id>")
@auth.login_required
def patient_version(patient_id, transaction_id):
    PatientVersion = version_class(md.Patient)

    patient_version = PatientVersion.query.filter_by(id=patient_id, transaction_id=transaction_id).first()

    if patient_version is None:
        return errors.resource_not_found("Version not found.".format(patient_id))

    result = {
        'id' : patient_id,
        'name' : patient_version.name,
        'transaction' : url_for('api.patient_version_transaction',patient_id=patient_id,
                                transaction_id=transaction_id)
    }

    return jsonify(result)


@api.route("/patients/<int:patient_id>/versions/<int:transaction_id>/transaction")
@auth.login_required
def patient_version_transaction(patient_id, transaction_id):
    PatientVersion = version_class(md.Patient)

    patient_version = PatientVersion.query.filter_by(id=patient_id, transaction_id=transaction_id).first()

    if patient_version is None:
        return errors.resource_not_found("Version not found.".format(patient_id))

    transaction = patient_version.transaction

    result = {
        'id' : transaction.id,
        'issued_at': transaction.issued_at,
        'user' : url_for('api.user',username=transaction.user.username),
        'remote_addr': transaction.remote_addr
    }

    return jsonify(result)
