from functools import wraps

from sqlalchemy import and_
from flask import g, abort, request, url_for

from . import errors
from .. import db
from ..models import Permission
from .errors import forbidden

def permission_required(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not g.current_user.can(permission):
                return forbidden("Insufficient Permission")
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def admin_required(f):
    return permission_required(Permission.ADMINISTER)(f)


def get_object(*models):
    def decorator(f):
        @wraps(f)
        def decorated_function(**item_ids):
            if not models:
                return f(None)
            objs = []
            for model in models:
                item_id_key = "{}_id".format(model.__tablename__)
                if item_id_key in item_ids:
                    obj = model.query.filter(
                        getattr(model, 'id') == item_ids[item_id_key]
                    ).first()
                    objs.append(obj)
                else:
                    objs.append(None)

            if None in objs:
                return errors.resource_not_found("Resource not found")

            for child, parent in zip(reversed(objs), reversed(objs[:-1])):
                child_parent = getattr(child, parent.__tablename__)
                if child_parent != parent:
                    return errors.resource_not_found("Resource not found")
    
            return f(objs[-1])
        return decorated_function
    return decorator


def get_object_query(*models):
    def decorator(f):
        @get_object(*(models[:-1]))
        @wraps(f)
        def decorated_function(parent_object):
            query = models[-1].query

            if (parent_object):
                query = query.filter(getattr(models[-1], parent_object.__tablename__) == parent_object)

            return f(query)
        return decorated_function
    return decorator



def new_object(*models):
    def decorator(f):
        @get_object(*(models[:-1]))
        @wraps(f)
        def decorated_function(parent_object):
            new_object = models[-1]()

            if parent_object:
                setattr(new_object, parent_object.__tablename__, parent_object)

            try:
                data = request.get_json()
                invalid_fields = new_object.validate_and_insert(data)
                if (invalid_fields):
                    return errors.invalid_fields(invalid_fields)
                db.session.add(new_object)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                return errors.unprocessable("Databse Error: {}".format(e))

            return f(new_object)
        return decorated_function
    return decorator
        

def update_object():
    def decorator(f):
        @wraps(f)
        def decorated_function(item):
            data = request.get_json()

            try:
                invalid_fields = item.validate_and_update(data)
                if (invalid_fields):
                    db.session.rollback()
                    return errors.invalid_fields(invalid_fields)

                db.session.commit()
            except Exception as e:
                db.session.rollback()
                return errors.unprocessable("Databse Error: {}".format(e))

            return f(item, data.keys())
        return decorated_function
    return decorator
