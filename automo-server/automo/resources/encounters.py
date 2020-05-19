from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response


@api.route("/patients/<int:patient_id>/encounters/")
def get_patient_encounters(patient_id):
    patient = md.Patient.query.get_or_404(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    query_result = md.Encounter.query.filter_by(patient_id=patient_id, parent=None)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = query_result.paginate(
        page, per_page=per_page, error_out=False
    )
    encounters = pagination.items
    prev = None
    if pagination.has_prev:
        prev = url_for('api.get_patient_encounters', patient_id=patient_id, page=page-1, per_page=per_page, _external=True)
    next = None
    if pagination.has_next:
        next = url_for('api.get_patient_encounters', patient_id=patient_id, page=page+1, per_page=per_page, _external=True)

    encounter_list = []
    for encounter in encounters:
        encounter_list.append(encounter.get_serialized())

    return jsonify({
        'encounters': encounter_list,
        'prev': prev,
        'next': next,
        'count': pagination.total
    })



@api.route("/patients/<int:patient_id>/encounters/<int:encounter_id>")
def get_patient_encounter(patient_id, encounter_id):
    encounter = md.Encounter.query.filter_by(id=encounter_id, patient_id=patient_id).first()

    if encounter is None:
        return errors.resource_not_found("Encounter not found.")

    data = encounter.get_serialized()

    return jsonify(data)


@api.route("/patients/<int:patient_id>/encounters/<int:encounter_id>", methods=['POST'])
def post_patient_encounter(patient_id, encounter_id):
    encounter = md.Encounter.query.filter_by(id=encounter_id, patient_id=patient_id).first()

    if encounter is None:
        return errors.resource_not_found("Encounter not found.")

    data = request.get_json()

    try:
        encounter.validate_and_setdata(data)
    except md.dbexception.FieldValueError as e:
        return errors.invalid_fields(e.invalid_fields)

    db.session.commit()

    return success_response("Encounter Saved")