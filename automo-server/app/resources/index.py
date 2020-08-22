from flask import url_for, jsonify, g

from .. import models as md
from .. import db

from . import api
from .authentication import auth
from . import errors

@api.route("/")
def main():
    result = {
        'hospitals': url_for('api.get_hospitals', _external=True),
        'patients' : url_for('api.get_patients', _external=True),
        'admissions' : url_for('api.get_admissions', _external=True),
        'user': url_for('api.user',username=g.current_user.username, _external=True),
        'users': url_for('api.add_user', _external=True),
        'auth_token': url_for('api.get_token', _external=True),
        'icd10': {
            'categories': url_for('api.get_icd10_categories', _external=True),
            'modifierclasses': url_for('api.get_icd10_modifier_classes', _external=True)
        },
        'wards': url_for('api.get_wards', _external=True),
        'personnel': {
            'all': url_for('api.get_personnel', _external=True),
            'doctors': url_for('api.get_personnel', type='doctor', _external=True)
        },
        'drugs': url_for('api.get_drugs', _external=True)
    }

    return jsonify(result)