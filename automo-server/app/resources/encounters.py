from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response
from .item_getters import get_query_result, get_one_query_result, post_one_query_result


@api.route("/patients/<int:patient_id>/encounters/")
def get_patient_encounters(patient_id):
    return get_query_result(
        md.Encounter.query.filter_by(patient_id=patient_id, parent=None),
        'api.get_patient_encounters',
        api_route_values={
            'patient_id': patient_id
        }
    )


@api.route("/patients/<int:patient_id>/encounters/<int:encounter_id>")
def get_patient_encounter(patient_id, encounter_id):
    return get_one_query_result(
        md.Encounter.query.filter_by(id=encounter_id, patient_id=patient_id)
    )


@api.route("/patients/<int:patient_id>/encounters/<int:encounter_id>", methods=['POST'])
def post_patient_encounter(patient_id, encounter_id):
    return post_one_query_result(
        md.Encounter.query.filter_by(id=encounter_id, patient_id=patient_id)
    )


@api.route("/patients/<int:patient_id>/encounters/<int:encounter_id>", methods=['DELETE'])
def delete_patient_encounter(patient_id, encounter_id):
    encounter = md.Encounter.query.filter_by(id=encounter_id, patient_id=patient_id).first()

    if encounter is None:
        return errors.resource_not_found("Encounter not found")

    try:
        db.session.delete(encounter)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable('Database Error: {}'.format(e))

    return jsonify({
        'status': 'success',
        'message': 'Deleted'
    })


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/encounters/")
def get_patient_admission_encounters(patient_id, admission_id):
    query = md.Encounter.query\
        .filter(md.Encounter.patient_id == patient_id)\
        .filter(md.Encounter.parent_id == admission_id)

    encounter_type = request.args.get('type', None)
    if encounter_type:
        if encounter_type not in md.encounters.ENCOUNTER_MODEL_TYPES:
            return errors.resource_not_found("Encounters of type {} not found".format(encounter_type))

        query = query.filter(md.Encounter.type == encounter_type)

    return get_query_result(
        query,
        'api.get_patient_admission_encounters',
        api_route_values={ 
            'patient_id' : patient_id,
            'admission_id' : admission_id
        }
    )


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/encounters/", methods=['POST'])
def new_patient_admission_encounter(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)\

    admission = query.first()

    if admission is None:
        return errors.resource_not_found("Admission not found")

    data = request.get_json()

    if not isinstance(data, dict):
        return errors.unprocessable("Unexpected data format")

    encounter_type = data.pop('type', None)

    if not encounter_type:
        return errors.invalid_fields({'type': "Encounter type not set" })

    if encounter_type not in md.encounters.ENCOUNTER_MODEL_TYPES:
        return errors.invalid_fields({'type': "Encounter type '{}' not supported".format(encounter_type) })

    encounter_model = md.encounters.ENCOUNTER_MODEL_TYPES[encounter_type]

    try:
        encounter = encounter_model()
        
        invalid_fields = encounter.validate_and_insert(data)
        if invalid_fields:
            return errors.invalid_fields(invalid_fields)
        
        admission.add_child_encounter(encounter)

        db.session.commit()
    except Exception as e:
        return errors.unprocessable('Databse Error: {}'.format(e))

    return jsonify(encounter.get_serialized())


