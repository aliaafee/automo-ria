"""Database Models"""
from sqlalchemy.orm import configure_mappers
import sqlalchemy_continuum


sqlalchemy_continuum.make_versioned(
    plugins=[sqlalchemy_continuum.plugins.FlaskPlugin()]
)

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
from .personnel import Personnel

configure_mappers()