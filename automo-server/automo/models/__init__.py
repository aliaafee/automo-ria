"""Database Models"""
from sqlalchemy.orm import configure_mappers
import sqlalchemy_continuum


def fetch_current_user():
    from flask.globals import _app_ctx_stack, _request_ctx_stack
    from flask import g

    if _app_ctx_stack.top is None or _request_ctx_stack.top is None:
        return
    try:
        return g.current_user.id
    except AttributeError:
        return

sqlalchemy_continuum.make_versioned(
    plugins=[sqlalchemy_continuum.plugins.FlaskPlugin(fetch_current_user)]
)

from .role import Role, Permission
from .user import User
from .icd10 import Icd10Modifier, Icd10ModifierClass, Icd10Class
from .patient import Patient
from .address import Address
from .bed import Bed
from .ward import Ward
from .problem_encounter import problem_encounter_association_table
from .problem import Problem
from .notes import Note,\
                   History
from .encounters import Encounter,\
                        ClinicalEncounter,\
                        Admission,\
                        CircumcisionAdmission,\
                        OutpatientEncounter,\
                        Measurements,\
                        VitalSigns,\
                        VitalSignsExtended,\
                        Progress,\
                        SurgicalProcedure,\
                        Investigation,\
                        Imaging,\
                        Endoscopy,\
                        Histopathology,\
                        OtherReport,\
                        CompleteBloodCount,\
                        RenalFunctionTest,\
                        LiverFunctionTest,\
                        OtherEncounter
from .complicationgrade import ComplicationGrade
from .prescription import Prescription
from .drug import Drug
from .personnel import Personnel, Doctor, MedicalOfficer, Nurse

configure_mappers()