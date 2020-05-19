from flask import url_for, jsonify, request

from .. import models as md

from . import api
from . import errors


@api.route("/patients/<int:patient_id>/problems/")
def get_patient_problems(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))
    
    query_result = md.Problem.query.filter_by(patient_id=patient_id)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 2, type=int)
    pagination = query_result.paginate(
        page, per_page=per_page, error_out=False
    )
    problems = pagination.items
    prev = None
    if pagination.has_prev:
        prev = url_for('api.get_patient_problems', patient_id=patient_id, page=page-1, per_page=per_page, _external=True)
    next = None
    if pagination.has_next:
        next = url_for('api.get_patient_problems', patient_id=patient_id, page=page+1, per_page=per_page, _external=True)

    problem_list = []
    for problem in problems:
        problem_list.append(problem.get_serialized())

    return jsonify({
        'encounters': problem_list,
        'prev': prev,
        'next': next,
        'count': pagination.total
    })

    #result = {}
    #for problem in problems:
    #    result[problem.id] = {
    #        "url" : problem.url()
    #    }

    #return jsonify(result)


@api.route("/patients/<int:patient_id>/problems/<int:problem_id>")
def get_patient_problem(patient_id, problem_id):
    problem = md.Problem.query.filter_by(id=problem_id, patient_id=patient_id).first()

    if problem is None:
        return errors.resource_not_found("Problem not found.")

    data = problem.get_serialized()

    return jsonify(data)