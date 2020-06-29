"""Problem"""
from flask import url_for

from .. import db
from . import dbexception
from .problem_encounter import problem_encounter_association_table
from .mixins import SerializerMixin, ValidatorMixin

class Problem(SerializerMixin, ValidatorMixin, db.Model):
    """The problem that the patient has, each problem has an icd10 code with relevant 
      modifiers, each problem can have multiple encounters. A problem has a start_date.
      Chronic problems eg: Hypertension do not have and end date. But acute problems that
      have resolved with no/minimal residual effects have an end date. For example Acute 
      Appendicites which has been operated on and patient had come for follow up and all 
      symptoms resolved can have the problem made inactive by entering an end date.

      TODO: Consider making the problems into a tree structure, eg: Dabetes Mellitus as
      root problem and child problem like Diabetic foot infections etc..."""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'start_time',
        'end_time',
        'icd10class',
        'icd10modifier_class',
        'icd10modifier_extra_class',
        'comment'
    ]

    required_attrs = [
        'start_time'
    ]

    def url(self):
        return url_for('api.get_patient_problem',patient_id=self.patient_id, problem_id=self.id, _external=True)


    id = db.Column(db.Integer, primary_key=True)

    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'))
    patient = db.relationship("Patient", back_populates="problems")

    start_time = db.Column(db.DateTime())
    end_time = db.Column(db.DateTime())

    encounters = db.relationship("Encounter",
                              secondary=problem_encounter_association_table,
                              back_populates="problems")

    comment = db.Column(db.Text)

    icd10class_code = db.Column(db.String(10), db.ForeignKey('icd10class.code'))
    icd10class = db.relationship("Icd10Class")

    icd10modifier_class_code = db.Column(db.String(20), db.ForeignKey('icd10modifierclass.code'))
    icd10modifier_class = db.relationship("Icd10ModifierClass",
                                       foreign_keys=[icd10modifier_class_code])

    icd10modifier_extra_class_code = db.Column(db.String(20), db.ForeignKey('icd10modifierclass.code'))
    icd10modifier_extra_class = db.relationship("Icd10ModifierClass",
                                             foreign_keys=[icd10modifier_extra_class_code])
    def add_encounter(self, encounter):
        """Add an encounter to the problem"""
        if self.patient != encounter.patient:
            raise dbexception.AutoMODatabaseError("The Problem and Encounter should be from the same patient")

        if encounter in self.encounters:
            raise dbexception.AutoMODatabaseError("This encounter already exists in this problem")

        self.encounters.append(encounter)
