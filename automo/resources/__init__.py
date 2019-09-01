from flask import Blueprint
#from flask_restful import Api

api = Blueprint('api', __name__, url_prefix="/api")
#api = Api(api_blueprint)

from . import users, authentication, index, patients, errors