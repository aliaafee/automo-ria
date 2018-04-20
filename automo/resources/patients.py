from flask import url_for
from flask_login import login_required
from flask_restful import Resource

from .. import models as md
from . import api
from . import errors


@api.resource("/patients/")
class Patients(Resource):
    decorators = [
        login_required
    ]
    def get(self):
        patients = md.Patient.query.all()

        result = {}
        for patient in patients:
            result[patient.id] = {
                'uri' : url_for('api.patient',patient_id=patient.id)
            }

        return result


@api.resource("/patients/<int:patient_id>")
class Patient(Resource):
    decorators = [
        login_required
    ]
    def get(self, patient_id):
        patient = md.Patient.query.get(patient_id)

        if patient is None:
            return errors.resource_not_found("Patient with id {} not found.".format(patient_id))

        result = {
            'id' : patient.id,
            'name' : patient.name
        }
        
        return result
