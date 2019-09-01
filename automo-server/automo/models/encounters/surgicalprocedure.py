"""Surgical Procedure"""
from ... import db
from .encounter import Encounter


class SurgicalProcedure(Encounter):
    """Surgical Procedure.
      The post operative diagnosis will be the problems associated with this
      encounter. Preoperative diagnosis will written in uncoded text form. The encounter
      start time will be the time the patient is induced and the encounter time is the time
      patient is transferred to recovery room. The main operating surgeon will be the doctor
      for the encounter. """
    __tablename__ = "surgicalprocedure"

    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'surgicalprocedure'
    }

    label = "Surgical Procedure"

    assistant = db.Column(db.Text())
    anesthetist = db.Column(db.Text())
    nurse = db.Column(db.Text())

    emergency = db.Column(db.Boolean)

    preoperative_diagnosis = db.Column(db.Text())

    postoperative_diagnosis = db.Column(db.Text())

    procedure_name = db.Column(db.Text())

    findings = db.Column(db.Text())

    steps = db.Column(db.Text())
