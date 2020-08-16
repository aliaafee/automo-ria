from flask import url_for

from .. import models as md

from . import api
from . import errors
from .decorators import admin_required, get_object_query, get_object, update_object, new_object
from .utilities import paginate_query


@api.route("/hospitals/")
@get_object_query(md.Hospital)
def get_hospitals(hospitals_query):
    return paginate_query(hospitals_query, get_arg_names=['q'])


@api.route("/hospitals/", methods=['POST'])
@admin_required
@new_object(md.Hospital)
def new_hospital(new_hospital):
    return new_hospital.get_serialized()


@api.route("/hospitals/<int:hospital_id>")
@get_object(md.Hospital)
def get_hospital(hospital):
    result = hospital.get_serialized()
    result['wards'] = url_for(
        'api.get_hospital_wards',
        hospital_id = hospital.id,
        _external=True
    )
    return result


@api.route("/hospitals/<int:hospital_id>", methods=['POST'])
@admin_required
@get_object(md.Hospital)
@update_object()
def post_hospital(hospital, updated_keys):
    return hospital.get_serialized(updated_keys)

#---

@api.route("/hospitals/<int:hospital_id>/wards/")
@get_object_query(md.Hospital, md.Ward)
def get_hospital_wards(wards_query):
    return paginate_query(wards_query)


@api.route("/hospitals/<int:hospital_id>/wards/", methods=['POST'])
@admin_required
@new_object(md.Hospital, md.Ward)
def new_hospital_ward(new_ward):
    return new_ward.get_serialized()


@api.route("/hospitals/<int:hospital_id>/wards/<int:ward_id>")
@get_object(md.Hospital, md.Ward)
def get_hospital_ward(ward):
    result = ward.get_serialized()
    result['beds'] = url_for(
        'api.get_hospital_ward_beds',
        hospital_id = ward.hospital.id,
        ward_id = ward.id,
        _external=True
    )
    return result


@api.route("/hospitals/<int:hospital_id>/wards/<int:ward_id>", methods=['POST'])
@admin_required
@get_object(md.Hospital, md.Ward)
@update_object()
def post_hospital_ward(hospital, updated_keys):
    return hospital.get_serialized(updated_keys)

#---

@api.route("/hospitals/<int:hospital_id>/wards/<int:ward_id>/beds/")
@get_object_query(md.Hospital, md.Ward, md.Bed)
def get_hospital_ward_beds(wards_query):
    return paginate_query(wards_query)


@api.route("/hospitals/<int:hospital_id>/wards/<int:ward_id>/beds/", methods=['POST'])
@admin_required
@new_object(md.Hospital, md.Ward, md.Bed)
def new_hospital_ward_bed(new_bed):
    return new_bed.get_serialized()


@api.route("/hospitals/<int:hospital_id>/wards/<int:ward_id>/beds/<int:bed_id>")
@get_object(md.Hospital, md.Ward, md.Bed)
def get_hospital_ward_bed(bed):
    result = bed.get_serialized()
    return result


@api.route("/hospitals/<int:hospital_id>/wards/<int:ward_id>/beds/<int:bed_id>", methods=['POST'])
@admin_required
@get_object(md.Hospital, md.Ward, md.Bed)
@update_object()
def post_hospital_ward_bed(bed, updated_keys):
    return bed.get_serialized(updated_keys)
