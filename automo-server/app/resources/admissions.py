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
            additional_data['discharge_summary_pdf'] = url_for(
                'api.get_patient_admission_discharge_summary_pdf',
                patient_id=patient_id, admission_id=admission_id,
                _external = True
            )
            additional_data['discharge_summary_html'] = url_for(
                'api.get_patient_admission_discharge_summary_html',
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

    encounters = {};
    for child_encounter_type in md.encounters.ENCOUNTER_MODEL_TYPES.keys():
        encounters[child_encounter_type] = url_for(
            'api.get_patient_admission_encounters',
            patient_id=patient_id, admission_id=admission_id,
            type=child_encounter_type,
            _external = True
        )

    additional_data['encounters'] = encounters

    additional_data['encounters_url'] = url_for(
        'api.get_patient_admission_encounters',
        patient_id=patient_id, admission_id=admission_id,
        _external = True
    )

    additional_data['problems_url'] = url_for(
        'api.get_patient_admission_problems',
        patient_id=patient_id, admission_id=admission_id,
        _external = True
    )

    additional_data['prescription_url'] = url_for(
        'api.get_patient_admission_prescription',
        patient_id=patient_id, admission_id=admission_id,
        _external = True
    )

    additional_data['initial_vitalsigns'] = None

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

    admission = query.first()
    if admission is None:
            return errors.resource_not_found('Admission not found')

    data = request.get_json()
    all_field_names = list(data.keys()).copy()

    end_admission = request.args.get('end', False, type=bool)
    if end_admission:

        try:
            admission.end()
            if 'end_time' in data:
                invalid_fields = admission.validate_and_update_field('end_time', data['end_time'])
                if invalid_fields:
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

    try:
        initial_vitalsigns = data.pop('initial_vitalsigns', None)
        personnel = data.pop('personnel', None)
        discharged_bed = data.pop('discharged_bed', None)

        invalid_fields = admission.validate_and_update(data)

        if personnel:
            personnel_id = personnel.pop('id')
            new_personnel = md.Personnel.query.get(personnel_id)
            if new_personnel:
                admission.personnel = new_personnel
            else:
                invalid_fields['personnel'] = 'Personnel not found'
        
        if discharged_bed:
            bed_id = discharged_bed.pop('id')
            new_bed = md.Bed.query.get(bed_id)
            if new_bed:
                admission.discharged_bed = new_bed
            else:
                invalid_fields['discharged_bed'] = 'Bed not found'

        if initial_vitalsigns:
            print("updating initial vital sign")
            #TODO: find the first vital sign and updae it

        if invalid_fields:
            db.session.rollback()
            return errors.invalid_fields(invalid_fields)


        db.session.commit()
    except ValueError as e:
    #except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Databse Error: {}".format(e))

    return admission.get_serialized(all_field_names)

    #return post_one_query_result(query)


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/discharge-summary.pdf")
def get_patient_admission_discharge_summary_pdf(patient_id, admission_id):
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


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/discharge-summary.html")
def get_patient_admission_discharge_summary_html(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)\
        .filter(md.Admission.end_time != None)

    admission = query.first()

    if admission is None:
        return errors.resource_not_found("Item with not found.")

    return render_template(
        'admission/discharge-summary.html',
        admission=admission,
        style=render_template(
            'admission/discharge-summary.css'
        )
    )
