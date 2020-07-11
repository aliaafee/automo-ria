from flask import url_for, jsonify, request

from .. import models as md
from .. import db

from . import api
from . import errors
from .item_getters import get_query_result, get_one_query_result, post_one_query_result


@api.route("/patients/<int:patient_id>/admissions/<int:admission_id>/prescription/")
def get_patient_admission_prescription(patient_id, admission_id):
    query = md.Prescription.query\
                .join(md.Admission, md.Prescription.clinicalencounter)\
                .join(md.Patient, md.Admission.patient)\
                .filter(
                    md.Admission.patient_id == patient_id,
                    md.Admission.id == admission_id,
                    md.Prescription.clinicalencounter_id == admission_id
                )

    return get_query_result(
        query,
        'api.get_patient_admission_prescription',
        api_route_values={
            'patient_id': patient_id,
            'admission_id': admission_id
        }
    )


@api.route("/patients/<int:patient_id>/admissions/<int:admission_id>/prescription/", methods=['POST'])
def post_patient_admission_prescription(patient_id, admission_id):
    admission = md.Admission.query.get(admission_id)

    if admission is None:
        return errors.resource_not_found('Admission Not Found')

    if admission.patient_id != patient_id:
        return errors.resource_not_found('Admission Not Found in Patient')

    prescription_data = request.get_json()

    if not prescription_data:
        return errors.unprocessable('Expected a list of medication orders')

    if not isinstance(prescription_data, list):
        return errors.unprocessable('Expected a list of medication orders')

    processed_items = []
    try:
        invalid_items = []
        for item in prescription_data:
            invalid_fields = {}
            """
            drug_id = item.pop('drug_id', None)
            drug = md.Drug.query.get(drug_id) if drug_id is not None else None

            drug_str = item.pop('drug_str', "")

            if drug_str == "" and drug is None:
                invalid_fields['drug_id'] = 'Both drug_id and drug_str cannot be empty/invalid'
                invalid_fields['drug_str'] = invalid_fields['drug_id']
            """
            drug = None
            drug_str = None
            
            drug_data = item.pop('drug', None)
            if drug_data:
                drug_id = drug_data.pop('id', None)
                drug_name = drug_data.pop('name', None)
                if drug_id:
                    drug = md.Drug.query.get(drug_id)
                    if drug is None:
                        invalid_fields['drug'] = {'id': 'Invalid Drug id'}
                elif drug_name:
                    drug_str = drug_name
                else:
                    invalid_fields['drug'] = 'Either valid drug_id or name should be given.'

            drug_order = item.pop('drug_order', None)
            if drug_order is None:
                invalid_fields['drug_order'] = 'Required'

            active = item.pop('active', True)
            try:
                active = bool(active)
            except ValueError:
                invalid_fields['active'] = "A boolean is required."

            

            if invalid_fields:
                invalid_items.append(invalid_fields)
            else:
                new_presc = admission.prescribe_drug(drug, drug_str, drug_order, active)
                processed_items.append(new_presc)
        
        if invalid_items:
            db.session.rollback()
            return errors.invalid_fields(invalid_items)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Database Error: {}".format(e))

    result = []
    for item in processed_items:
        result.append(item.get_serialized())

    return jsonify(result)
