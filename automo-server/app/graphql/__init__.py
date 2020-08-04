import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyConnectionField
from flask import Blueprint, g
from flask_graphql import GraphQLView

from .patient import Patient
from .address import Address
from .problem import Problem
from .icd10 import Icd10Class, Icd10Modifier, Icd10ModifierClass


class Query(graphene.ObjectType):
    node = relay.Node.Field()
    
    all_patients = SQLAlchemyConnectionField(Patient.connection)
    #patients = graphene.List(Patient, query=graphene.String())

    #@staticmethod
    #def resolve_patients(parent, info, **args):
    #    query = args.get('query')

    #    print(query)

    #    patients_query = Patient.get_query(info)

    #    return patients_query.all()

    




schema = graphene.Schema(
    query=Query,
    types=[
        Patient,
        Address,
        Problem,
        Icd10Class,
        Icd10Modifier,
        Icd10ModifierClass
    ]
)
