from flask import url_for, jsonify, request

from .. import models as md

from . import api
from . import errors
from .item_getters import get_query_result, get_one_query_result, post_one_query_result


@api.route("/patients/<int:patient_id>/problems/")
def get_patient_problems(patient_id):
    return get_query_result(
        md.Problem.query.filter_by(patient_id=patient_id),
        'api.get_patient_problems',
        api_route_values={
            'patient_id': patient_id
        }
    )


@api.route("/patients/<int:patient_id>/problems/<int:problem_id>")
def get_patient_problem(patient_id, problem_id):
    return get_one_query_result(
        md.Problem.query.filter_by(id=problem_id, patient_id=patient_id)
    )


@api.route("/patients/<int:patient_id>/problems/<int:problem_id>", methods=['POST'])
def post_patient_problem(patient_id, problem_id):
    return post_one_query_result(
        md.Problem.query.filter_by(id=problem_id, patient_id=patient_id)
    )
