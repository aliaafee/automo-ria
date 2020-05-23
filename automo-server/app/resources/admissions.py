from flask import url_for, jsonify, request, render_template
from flask_weasyprint import HTML, CSS, render_pdf

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
    discharged = request.args.get('discharges', False, type=bool)

    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)
    if discharged:
        query = query.filter(md.Admission.end_time != None)
    query = query.order_by(md.Admission.end_time.desc())

    return get_query_result(
        query,
        'api.get_patient_admissions',
        api_route_values={
            'patient_id' : patient_id 
        }
    )


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

    return get_one_query_result(query, additional_data=additional_data)


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>", methods=['POST'])
def post_patient_admission(patient_id, admission_id):
    query = md.Admission.query\
        .filter(md.Admission.patient_id == patient_id)\
        .filter(md.Admission.id == admission_id)

    return post_one_query_result(query)


@api.route("patients/<int:patient_id>/admissions/<int:admission_id>/encounters/")
def get_patient_admission_encounters(patient_id, admission_id):
    query = md.Encounter.query\
        .filter(md.Encounter.patient_id == patient_id)\
        .filter(md.Encounter.parent_id == admission_id)

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
