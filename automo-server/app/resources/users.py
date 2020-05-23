from flask import url_for, jsonify, g
from flask_restful import Resource

from .. import models as md
from .. import db

from .decorators import admin_required
from . import api
from .authentication import auth
from . import errors


@api.route("/users/")
@admin_required
def users():
    users = md.User.query.all()

    result = {}
    for user in users:
        result[user.username] = {
            'uri' : url_for('api.user',username=user.username)
        }

    return jsonify(result)


@api.route("/users/<username>")
def user(username):
    user = md.User.query.filter_by(username=username).first()

    if user is None:
        return errors.resource_not_found("User `{}' not found.".format(username))

    if not (user is g.current_user):
        if not g.current_user.is_administrator():
            return errors.resource_not_found("User `{}' not found.".format(username))
    
    result = {
        'username' : user.username,
        'fullname' : user.fullname
    }
    
    return jsonify(result)
