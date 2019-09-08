from flask import g, jsonify, current_app, url_for
from flask_httpauth import HTTPBasicAuth

from .. import models as md
from .errors import unauthorized
from . import api

auth = HTTPBasicAuth()


@api.route('/token')
def get_token():
    if g.token_used:
        return unauthorized('Invalid credentials')
    token = g.current_user.generate_auth_token(
        expiration=current_app.config['AUTH_TOKEN_LIFE'])
    return jsonify(
        {
            'token': token.decode('ascii'),
            'expiration': current_app.config['AUTH_TOKEN_LIFE']
        }
    )


@auth.verify_password
def verify_password(username_or_token, password):
    if password == '':
        g.current_user = md.User.verify_auth_token(username_or_token)
        g.token_used = True
        return g.current_user is not None
    user = md.User.query.filter_by(username=username_or_token).first()
    if not user:
        return False
    g.current_user = user
    g.token_used = False
    return user.verify_password(password)


@auth.error_handler
def auth_error():
    return unauthorized('Invalid credentials')