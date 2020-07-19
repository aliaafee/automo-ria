"""Encounters"""

from .encounter import Encounter
from .clinicalencounter import ClinicalEncounter,\
                               Admission,\
                               CircumcisionAdmission,\
                               OutpatientEncounter
from .measurements import Measurements
from .vitalsigns import VitalSigns,\
                        VitalSignsExtended
from .surgicalprocedure import SurgicalProcedure
from .investigation import Investigation,\
                           Imaging,\
                           Endoscopy,\
                           Histopathology,\
                           OtherReport,\
                           CompleteBloodCount,\
                           RenalFunctionTest,\
                           LiverFunctionTest,\
                           OtherTest
from .progress import Progress
from .otherencounter import OtherEncounter



ENCOUNTER_MODELS = [
    Measurements, 
    VitalSigns, 
    VitalSignsExtended, 
    SurgicalProcedure,
    Imaging,
    Endoscopy,
    Histopathology,
    OtherReport,
    CompleteBloodCount,
    RenalFunctionTest,
    LiverFunctionTest,
    OtherTest,
    Progress,
    OtherEncounter
]

ENCOUNTER_MODEL_TYPES = {}

for encounter in ENCOUNTER_MODELS:
    ENCOUNTER_MODEL_TYPES[
        encounter.__mapper_args__['polymorphic_identity']
    ] = encounter 