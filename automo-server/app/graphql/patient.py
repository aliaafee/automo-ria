from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from .. import models as md 


class Patient(SQLAlchemyObjectType):
    class Meta:
        model = md.Patient
        interfaces = (relay.Node, )