from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType

from .. import models as md 

class Icd10Modifier(SQLAlchemyObjectType):
    class Meta:
        model = md.Icd10Modifier
        interfaces = (relay.Node, )


class Icd10ModifierClass(SQLAlchemyObjectType):
    class Meta:
        model = md.Icd10ModifierClass
        interfaces = (relay.Node, )


class Icd10Class(SQLAlchemyObjectType):
    class Meta:
        model = md.Icd10Class
        interfaces = (relay.Node, )

