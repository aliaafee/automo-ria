from flask.json import jsonify
from . import api_bp


def resource_not_found(message=''):
    response = jsonify({'error': 'resource not found', 'message': message})
    response.status_code = 404
    return response
