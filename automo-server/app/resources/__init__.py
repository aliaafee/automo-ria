from flask import Blueprint, g
from flask_graphql import GraphQLView

api = Blueprint('api', __name__, url_prefix="/api")

from . import users,\
              authentication,\
              index,\
              patients,\
              errors,\
              problems,\
              encounters,\
              addresses,\
              phone_numbers,\
              beds,\
              wards,\
              admissions,\
              icd10,\
              personnel,\
              prescription,\
              drugs

from ..graphql import schema

api.add_url_rule(
    "/graphql",
    view_func=GraphQLView.as_view("graphql", schema=schema, graphiql=True)
)

@api.before_request
@authentication.auth.login_required
def before_request():
    if not hasattr(g, 'current_user'):
        return errors.unauthorized('Unauthorized')
    if not g.current_user:
        return errors.unauthorized('Unauthorized')
