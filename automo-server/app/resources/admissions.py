from flask import url_for, jsonify, request, render_template
from flask_weasyprint import HTML, CSS, render_pdf
import dateutil

from .. import models as md
from .. import db

from . import api
from . import errors
from .success import success_response
from .item_getters import get_query_result, get_one_query_result, post_one_query_result, problems_data_to_problems


def get_serialized_admission(admission):
    additional_data = {}

    if admission.end_time is not None:
        additional_data['discharge_summary_pdf'] = url_for(
            'api.get_patient_admission_discharge_summary_pdf',
            patient_id=admission.patient_id, admission_id=admission.id,
            _external = True
        )
        additional_data['discharge_summary_html'] = url_for(
            'api.get_patient_admission_discharge_summary_html',
            patient_id=admission.patient_id, admission_id=admission.id,
            _external = True
        )
    else:
        additional_data['discharge'] = url_for(
            'api.post_patient_admission',
            patient_id=admission.patient_id, admission_id=admission.id,
            end=True, 
            _external=True
        )

    encounters = {};
    for child_encounter_type in md.encounters.ENCOUNTER_MODEL_TYPES.keys():
        encounters[child_encounter_type] = url_for(
            'api.get_patient_admission_encounters',
            patient_id=admission.patient_id, admission_id=admission.id,
            type=child_encounter_type,
            _external = True
        )

    additional_data['encounters'] = encounters

    additional_data['encounters_url'] = url_for(
        'api.get_patient_admission_encounters',
        patient_id=admission.patient_id, admission_id=admission.id,
        _external = True
    )

    additional_data['problems_url'] = url_for(
        'api.get_patient_admission_problems',
        patient_id=admission.patient_id, admission_id=admission.id,
        _external = True
    )

    additional_data['prescription_url'] = url_for(
        'api.get_patient_admission_prescription',
        patient_id=admission.patient_id, admission_id=admission.id,
        _external = True
    )

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
        'initial_vitalsigns',
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

    admission_serialized = admission.get_serialized(fields)
    admission_serialized.update(additional_data)

    return admission_serialized


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


@api.route("/admissions/", methods=['POST'])
def new_admission():
    admission_data = request.get_json()

    patient_data = admission_data.pop('patient', None)
    if not patient_data:
        return errors.invalid_fields({'patient': 'Patient is required'})

    try:
        patient_id = patient_data.pop('id', None)
        if not patient_id:
            patient = md.Patient()

            invalid_fields = patient.validate_and_insert(patient_data)
            if invalid_fields:
                return errors.invalid_fields({'patient': invalid_fields})

            db.session.add(patient)
        else:
            patient = md.Patient.query.get(patient_id)

            if not patient:
                return errors.invalid_fields({'patient': 'Patient with id {} not found'.format(patient_id)})

        personnel_data = admission_data.pop('personnel', None)
        if personnel_data:
            admission_data['personnel_id'] = personnel_data.pop('id', None)
        
        discharged_bed_data = admission_data.pop('discharged_bed', None)
        if discharged_bed_data:
            admission_data['discharged_bed_id'] = discharged_bed_data.pop('id', None)
        else:
            return errors.invalid_fields({'discharged_bed': 'Required'})

        initial_vitalsigns_data = admission_data.pop('initial_vitalsigns', None)
        problems_data = admission_data.pop('problems', None)
        encounters_data = admission_data.pop('encounters', None)
        prescription_data = admission_data.pop('prescription', None)

        admission = md.Admission()
        invalid_fields = admission.validate_and_insert(admission_data)
        if invalid_fields:
            db.session.rollback()
            return errors.invalid_fields(invalid_fields)
        patient.encounters.append(admission)

        if initial_vitalsigns_data:
            initial_vitalsigns = md.VitalSigns()
            invalid_fields = initial_vitalsigns.validate_and_insert(initial_vitalsigns_data)
            if invalid_fields:
                db.session.rollback()
                return errors.invalid_fields({'initial_vitalsigns': invalid_fields })
            admission.add_child_encounter(initial_vitalsigns)

        problems = []
        if problems_data:
            try:
                problems = problems_data_to_problems(problems_data)
            except md.dbexception.FieldValueError as e:
                db.session.rollback()
                return errors.invalid_fields({'problems': e.invalid_fields})

        encounters = []
        if encounters_data:
            #TODO
            print("Adding encounters")

        prescription = []
        if prescription_data:
            #TODO
            print("Adding prescription")

        for problem in problems:
            patient.problems.append(problem)
            admission.add_problem(problem)
            db.session.commit()

        db.session.commit()

        #add encounters and prescription

    except md.dbexception.AutoMODatabaseError as e:
        db.session.rollback()
        return errors.unprocessable('Database Error: {}'.format(e))
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable('Error: {}'.format(e))

    admission_serialized = get_serialized_admission(admission)
    admission_serialized['patient'] = patient.get_serialized()

    return jsonify(admission_serialized)


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

    return jsonify(
        get_serialized_admission(admission)
    )


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>")
def get_patient_admission(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)

    admission = query.first()

    if admission is None:
        return errors.resource_not_found("Item not found.")

    return jsonify(
        get_serialized_admission(admission)
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
        initial_vitalsigns_data = data.pop('initial_vitalsigns', None)
        personnel_data = data.pop('personnel', None)
        discharged_bed_data = data.pop('discharged_bed', None)
        problems_data = data.pop('problems', None)

        invalid_fields = admission.validate_and_update(data)

        if personnel_data:
            personnel_id = personnel_data.pop('id')
            new_personnel = md.Personnel.query.get(personnel_id)
            if new_personnel:
                admission.personnel = new_personnel
            else:
                invalid_fields['personnel'] = 'Personnel not found'
        
        if discharged_bed_data:
            bed_id = discharged_bed_data.pop('id')
            new_bed = md.Bed.query.get(bed_id)
            if new_bed:
                admission.discharged_bed = new_bed
            else:
                invalid_fields['discharged_bed'] = 'Bed not found'

        if initial_vitalsigns_data:
            initial_vitalsigns = admission.initial_vitalsigns
            if initial_vitalsigns:
                invalid_vitals = initial_vitalsigns.validate_and_update(initial_vitalsigns_data)
            else:
                initial_vitalsigns = md.VitalSigns()
                invalid_vitals = initial_vitalsigns.validate_and_insert(initial_vitalsigns_data)
                admission.add_child_encounter(initial_vitalsigns)
            if invalid_vitals:
                invalid_fields['initial_vitalsigns'] = invalid_vitals

        problems = []
        if problems_data:
            try:
                problems = problems_data_to_problems(problems_data)
            except md.dbexception.FieldValueError as e:
                invalid_fields['problems'] = e.invalid_fields

        if invalid_fields:
            db.session.rollback()
            return errors.invalid_fields(invalid_fields)

        problems_to_delete = []
        for problem in admission.problems:
            if problem not in problems:
                problems_to_delete.append(problem)
        for problem in problems_to_delete:
            admission.remove_problem(problem)
            db.session.commit()
        
        for problem in problems:
            if problem not in admission.patient.problems:
                admission.patient.problems.append(problem)
            if problem not in admission.problems:
                admission.add_problem(problem)
                db.session.commit()

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Databse Error: {}".format(e))

    return admission.get_serialized(all_field_names)


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
