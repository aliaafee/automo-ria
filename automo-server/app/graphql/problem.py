from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from .. import models as md 

class Problem(SQLAlchemyObjectType):
    class Meta:
        model = md.Problem
        interfaces = (relay.Node, )