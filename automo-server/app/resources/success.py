from flask.json import jsonify


def success_response(message=''):
    return jsonify({'success' : 'success', 'message' : message})
