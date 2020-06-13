from flask import url_for, jsonify, request

from .. import models as md
from .. import db

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


@api.route("/patients/<int:patient_id>/admissions/<int:admission_id>/problems/")
def get_patient_admission_problems(patient_id, admission_id):
    query = md.Problem.query\
                .join(md.Admission, md.Problem.encounters)\
                .filter(
                    md.Problem.patient_id == patient_id,
                    md.Admission.patient_id == patient_id,
                    md.Admission.id == admission_id
                )

    return get_query_result(
        query,
        'api.get_patient_admission_problems',
        api_route_values={
            'patient_id': patient_id,
            'admission_id': admission_id
        }
    )


@api.route("/patients/<int:patient_id>/admissions/<int:admission_id>/problems/", methods=['POST'])
def post_patient_admission_problems(patient_id, admission_id):
    admission = md.Admission.query.get(admission_id)

    if admission is None:
        return errors.resource_not_found('Admission Not Found')

    if admission.patient_id != patient_id:
        return errors.resource_not_found('Admission Not Found in Patient')

    problems_data = request.get_json()
    
    processed_problems = []
    try:
        invalid_problems = []
        for problem_data in problems_data:
            problem_id = problem_data.pop('id', None)
            if problem_id is None:
                new_problem = md.Problem()
                invalid_fields = new_problem.validate_and_insert(problem_data)
                if invalid_fields:
                    invalid_problems.append(invalid_fields)
                else:
                    admission.patient.problems.append(new_problem)
                    processed_problems.append(new_problem)
            else:
                existing_problem = md.Problem.query.get(problem_id)
                if existing_problem == None:
                    invalid_problems.append({
                        problem_id: "Problem not found"
                    })
                else:
                    if existing_problem.patient_id != admission.patient_id:
                        invalid_problems.append({
                            problem_id: "This Problem is of another patient"
                        })
                    else:
                        processed_problems.append(existing_problem)

        if invalid_problems:
            db.session.rollback()
            return errors.invalid_fields(invalid_problems)
        
        for processed_problem in processed_problems:
            admission.add_problem(processed_problem)
            db.session.commit()

    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Databse Error: {}".format(e))
                
    result = []
    for problem in processed_problems:
        result.append(problem.get_serialized())

    return jsonify(result)

