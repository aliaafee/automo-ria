from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from .. import models as md 

class Address(SQLAlchemyObjectType):
    class Meta:
        model = md.Address
        interfaces = (relay.Node, )