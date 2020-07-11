from flask import url_for, jsonify, g, request
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


@api.route("/users/", methods=['POST'])
@admin_required
def add_user():
    user_data = request.get_json()

    invalid_fields = {}

    username = user_data.pop('username', None)
    if not username:
        invalid_fields['username'] = 'Username is required'

    user = md.User.query.filter_by(username=username).first()
    if user:
        invalid_fields['username'] = "User '{}' already exists.".format(username)

    fullname = user_data.pop('fullname', None)
    if not fullname:
        invalid_fields['fullname'] = 'Fullname is required'

    password = user_data.pop('password', None)
    if not password:
        invalid_fields['password'] = 'Password is not valid'

    personnel = None
    personnel_data = user_data.pop('personnel', None)
    if personnel_data:
        personnel_id = personnel_data.pop('id', personnel_data)
        if personnel_id:
            personnel = md.Personnel.query.get(personnel_id)
            if personnel is None:
                invalid_fields['personnel'] = {'id': 'Personnel with id {} not found'.format(personnel_id)}

    if invalid_fields:
        return errors.invalid_fields(invalid_fields)

    try:
        user = md.User()
        user.username = username
        user.fullname = fullname
        user.password = password
        user.personnel = personnel

        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Database Error: {}".format(e))

    return user.get_serialized()



@api.route("/users/<username>")
def user(username):
    user = md.User.query.filter_by(username=username).first()

    if user is None:
        return errors.resource_not_found("User `{}' not found.".format(username))

    if not (user is g.current_user):
        if not g.current_user.is_administrator():
            return errors.resource_not_found("User `{}' not found.".format(username))
    
    return jsonify(user.get_serialized())


@api.route("/users/<username>", methods=['POST'])
def update_user(username):
    user = md.User.query.filter_by(username=username).first()

    if user is None:
        return errors.resource_not_found("User `{}' not found.".format(username))

    if not (user is g.current_user):
        if not g.current_user.is_administrator():
            #User is allowed to change their password, admin can change all passwords
            #Is this secure? Will have to re-evaluate this.
            return errors.resource_not_found("User `{}' not found.".format(username))

    user_data = request.get_json()

    invalid_fields = {}

    fullname = user_data.pop('fullname', None)
    if fullname == '':
        invalid_fields['fullname'] = 'Fullname is required'

    password = user_data.pop('password', None)
    if password == '':
        invalid_fields['password'] = 'Password is not valid'

    personnel = None
    personnel_data = user_data.pop('personnel', None)
    if personnel_data:
        if g.current_user.is_administrator():
            #Only administrator is allowed to edit personnel of user
            personnel_id = personnel_data.pop('id', personnel_data)
            if personnel_id:
                personnel = md.Personnel.query.get(personnel_id)
                if personnel is None:
                    invalid_fields['personnel'] = {'id': 'Personnel with id {} not found'.format(personnel_id)}
        else:
            invalid_fields['personnel'] = "Not authorized to change this"

    if invalid_fields:
        return errors.invalid_fields(invalid_fields)

    try:
        if fullname:
            user.fullname = fullname

        if password:
            user.password = password

        if g.current_user.is_administrator():
            if personnel_data:
                user.personnel = personnel

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return errors.unprocessable("Database Error: {}".format(e))

    return jsonify(user.get_serialized())
