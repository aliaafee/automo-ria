from flask import url_for, jsonify

from .. import models as md

from . import api
from . import errors


@api.route("/patients/<int:patient_id>/encounters/")
def patient_encounters(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

    encounters = patient.encounters

    result = {}
    for encounter in encounters:
        result[encounter.id] = {
            'type': encounter.type,
            'label' : encounter.label,
            'start_time': encounter.start_time,
            'end_time': encounter.end_time,
            'personnel' : '?',
        }
        #result['problems'] = {}
        result[encounter.id]['problems'] = {}
        problems_dict = result[encounter.id]['problems']
        for problem in encounter.problems:
            problems_dict[problem.id] = {
                'url': url_for('api.patient_problem', patient_id=patient_id, problem_id=problem.id, _external=True),
                'icd10class_code': problem.icd10class_code,
                'icd10class_preffered_plain': problem.icd10class.preferred_plain,
                'icd10modifier_class_code': problem.icd10modifier_class_code,
                #'icd10modifier_class_preferred': problem.icd10modifier_class.preferred
            }


    return jsonify(result)


@api.route("/patients/<int:patient_id>/encounters/<int:encounter_id>")
def patient_encounter(patient_id, encounter_id):
    encounter = md.Encounter.query.filter_by(id=encounter_id, patient_id=patient_id).first()

    if encounter is None:
        return errors.resource_not_found("Encounter not found.")

    result = {
        'id': encounter.id,
        
    }

    return jsonify(result)