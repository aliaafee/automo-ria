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
