from flask import url_for, jsonify

from .. import models as md

from . import api
from . import errors


@api.route("/patients/<int:patient_id>/problems/")
def patient_problems(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    problems = patient.problems

    result = {}
    for problem in problems:
        result[problem.id] = {
            "url" : url_for('api.patient_problem',patient_id=patient.id,
                            problem_id=problem.id, _external=True)
        }

    return jsonify(result)


@api.route("/patients/<int:patient_id>/problems/<int:problem_id>")
def patient_problem(patient_id, problem_id):
    problem = md.Problem.query.filter_by(id=problem_id, patient_id=patient_id).first()

    if problem is None:
        return errors.resource_not_found("Problem not found.")

    result = {
        'id': problem.id
    }

    return jsonify(result)