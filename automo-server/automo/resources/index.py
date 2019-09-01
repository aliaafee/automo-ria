from flask import url_for, jsonify, g

from .. import models as md
from .. import db

from . import api
from .authentication import auth
from . import errors

@api.route("/")
def main():
    result = {
        'patients' : url_for('api.patients')
    }

    return jsonify(result)