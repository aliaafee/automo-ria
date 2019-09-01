from flask.json import jsonify


def resource_not_found(message=''):
    response = jsonify({'error': 'resource not found', 'message': message})
    response.status_code = 404
    return response


def unauthorized(message):
    response = jsonify({'error': 'unauthorized', 'message': message})
    response.status_code = 401
    return response
