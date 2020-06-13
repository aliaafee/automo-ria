from flask import url_for, jsonify, request, render_template
from flask_weasyprint import HTML, CSS, render_pdf
import dateutil

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response
from .item_getters import get_query_result, get_one_query_result, post_one_query_result


@api.route("/admissions/")
def get_admissions():
    discharged = request.args.get('discharges', False, type=bool)
    
    query = md.Admission.query
    if discharged:
        query = query.filter(md.Admission.end_time != None)
    query = query.order_by(md.Admission.end_time.desc())

    return get_query_result(
        query,
        'api.get_admission'
    )


@api.route("patients/<int:patient_id>/admissions/")
def get_patient_admissions(patient_id):
    discharged = request.args.get('discharged', False, type=bool)
    active = request.args.get('active', False, type=bool)

    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)

    if discharged:
        query = query.filter(md.Admission.end_time != None)

    if active:
        query = query.filter(md.Admission.end_time == None)

    query = query.order_by(md.Admission.start_time.desc())

    return get_query_result(
        query,
        'api.get_patient_admissions',
        api_route_values={
            'patient_id' : patient_id 
        },
        fields=[
            'id',
            'label',
            'type',
            'start_time',
            'end_time',
            'personnel',
            'problems'
        ]
    )


@api.route("patients/<int:patient_id>/admissions/", methods=['POST'])
def new_patient_admission(patient_id):
    patient = md.Patient.query.get(patient_id)

    if patient is None:
        return errors.resource_not_found('Patient not found')

    data = request.get_json()

    invalid_fields = {}

    personnel_id = data.pop('personnel_id', None)
    if personnel_id is None:
        invalid_fields['personnel_id'] = 'Doctor not set'
    else:
        doctor = md.Personnel.query.get(personnel_id)
        if doctor is None:
            invalid_fields['personnel_id'] = 'Doctor not found'

    bed_id = data.pop('bed_id', None)
    if bed_id is None:
        invalid_fields['bed_id'] = 'Bed not set'
    else:
        bed = md.Bed.query.get(bed_id)
        if bed is None:
            invalid_fields['bed_id'] = 'Bed not found'
        else:
            if bed.admission is not None:
                invalid_fields['bed_id'] = 'Bed {} is already occupied'.format(bed.name)

    #start_time = data.pop('start_time', None)
    end_time = data.pop('end_time', None)

    if invalid_fields:
        return errors.invalid_fields(invalid_fields)

    try:
        admission = patient.admit(doctor, bed)

        result = admission.validate_and_update(data)
        
        if result:
            db.session.rollback
            return errors.invalid_fields(result)
        
        db.session.commit()

        if end_time:
            db.session.commit()
            admission.end(end_time)

    except md.dbexception.AutoMODatabaseError as e:
        db.session.rollback()
        return errors.unprocessable('Database Error: {}'.format(e))
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable('Error: {}'.format(e))

    return admission.get_serialized()


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>")
def get_patient_admission(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)

    admission = query.first()

    additional_data = {}

    if admission is not None:
        if admission.end_time is not None:
            additional_data['discharge-summary'] = url_for(
                'api.post_patient_admission_discharge_summary',
                patient_id=patient_id, admission_id=admission_id,
                _external = True
            )
        else:
            additional_data['discharge'] = url_for(
                'api.post_patient_admission',
                patient_id=patient_id, admission_id=admission_id,
                end=True, 
                _external=True
            )

    child_encounter_types = [
        'vitalsigns',
        'imaging',
        'endoscopy',
        'histopathology',
        'otherreport',
        'completebloodcount',
        'renalfunctiontest',
        'liverfunctiontest',
        'othertest'
    ]

    encounters = {};
    for child_encounter_type in child_encounter_types:
        encounters[child_encounter_type] = url_for(
            'api.get_patient_admission_encounters',
            patient_id=patient_id, admission_id=admission_id,
            type=child_encounter_type,
            _external = True
        )

    encounters['all_encounters'] = url_for(
        'api.get_patient_admission_encounters',
        patient_id=patient_id, admission_id=admission_id,
        _external = True
    )

    additional_data['encounters'] = encounters
    additional_data['problems_url'] = url_for(
        'api.get_patient_admission_problems',
        patient_id=patient_id, admission_id=admission_id,
        _external = True
    )


    return get_one_query_result(
        query, 
        additional_data=additional_data,
        fields=[
            'id',
            'label',
            'type',
            'bed',
            'discharged_bed',
            'start_time',
            'end_time',
            #'children',
            'personnel',
            'problems',
            'chief_complaints',
            'history',
            'past_history',
            'general_inspection',
            'exam_head',
            'exam_neck',
            'exam_chest',
            'exam_abdomen',
            'exam_genitalia',
            'exam_pelvic_rectal',
            'exam_extremities',
            'exam_other',
            'hospital_course',
            'discharge_advice',
            'prescription',
            'follow_up'
        ]
    )


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>", methods=['POST'])
def post_patient_admission(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)

    end_admission = request.args.get('end', False, type=bool)
    if end_admission:
        admission = query.first()

        if admission is None:
            return errors.resource_not_found('Admission not found')

        data = request.get_json()

        try:
            admission.end()
            if 'end_time' in data:
                result = admission.validate_and_update_field('end_time', data['end_time'])
                if result:
                    db.session.rollback()
                    return errors.invalid_fields({'end_time': 'End time not valid'})
            db.session.commit()
        except md.dbexception.AutoMODatabaseError as e:
            db.session.rollback()
            return errors.unprocessable("Database Error: {}".format(e))
        except Exception as e:
            db.session.rollback()
            return errors.unprocessable("Error: {}".format(e))

        return admission.get_serialized()

    return post_one_query_result(query)


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/encounters/")
def get_patient_admission_encounters(patient_id, admission_id):
    query = md.Encounter.query\
        .filter(md.Encounter.patient_id == patient_id)\
        .filter(md.Encounter.parent_id == admission_id)

    encounter_type = request.args.get('type', '')
    if encounter_type:
        query = query.filter(md.Encounter.type == encounter_type)

    return get_query_result(
        query,
        'api.get_patient_admission_encounters',
        api_route_values={ 
            'patient_id' : patient_id,
            'admission_id' : admission_id
        }
    )


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/discharge-summary.pdf")
def post_patient_admission_discharge_summary(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)\
        .filter(md.Admission.end_time != None)

    admission = query.first()

    if admission is None:
        return errors.resource_not_found("Item with not found.")

    return render_pdf(
        HTML(
            string=render_template(
                'admission/discharge-summary.html',
                admission=admission
            )
        ),
        stylesheets=[
            CSS(
                string=render_template(
                    'admission/discharge-summary.css'
                )
            )
        ]
    )
