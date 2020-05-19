from flask import Blueprint, g
#from flask_restful import Api

api = Blueprint('api', __name__, url_prefix="/api")
#api = Api(api_blueprint)

from . import users, authentication, index, patients, errors, problems, encounters, addresses, phone_numbers

@api.before_request
@authentication.auth.login_required
def before_request():
    if not g.current_user:
        return errors.unauthorized('Unauthorized')
