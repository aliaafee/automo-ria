from flask import url_for, jsonify, g

from .. import models as md
from .. import db

from . import api
from .authentication import auth
from . import errors

@api.route("/")
def main():
    result = {
        'patients' : url_for('api.get_patients', _external=True),
        'user': url_for('api.user',username=g.current_user.username, _external=True),
        'auth_token': url_for('api.get_token', _external=True),
        'icd10': {
            'categories': url_for('api.get_icd10_categories', _external=True),
            'modifierclasses': url_for('api.get_icd10_modifier_classes', _external=True)
        }
    }

    return jsonify(result)