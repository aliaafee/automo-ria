"""Encounters"""
import datetime
from dateutil.relativedelta import relativedelta
from flask import url_for

from ... import db
from .. import dbexception
from ..problem_encounter import problem_encounter_association_table
from ..mixins import SerializerMixin, ValidatorMixin


class Encounter(SerializerMixin, ValidatorMixin, db.Model):
    """The encounter that the patient had with health facility, each encounter
      can be for single or multiple problems. the encounter object can be polymorphic,
      eg: HospitalStay and ClinicVisit are child classes. Possiblity of expanding
      to include other kinds of encounters, and these child encounters can be extended
      furture with more child classes.
      Each encounter instance can have multiple child encounter instances, for example
      a HospitalStay encounter instance can have a SurgicalProcedure as a child encounter
      instance.
      Each encounter has a start time and end time, and is associated with a personnel."""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'label',
        'type',
        'start_time',
        'end_time',
        'children',
        'personnel',
        'problems'
    ]

    required_attrs = [
        'start_time'
    ]

    def url(self):
        return url_for('api.get_patient_encounter', patient_id=self.patient_id, encounter_id=self.id, _external=True)


    id = db.Column(db.Integer, primary_key=True)

    type = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity':'encounter',
        'polymorphic_on':type
    }

    label = "Encounter"

    parent_id = db.Column(db.Integer, db.ForeignKey("encounter.id"))
    children = db.relationship('Encounter',
                            backref=db.backref("parent", remote_side='Encounter.id'))

    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'))
    patient = db.relationship("Patient", back_populates="encounters")

    start_time = db.Column(db.DateTime())
    end_time = db.Column(db.DateTime())

    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'))
    personnel = db.relationship("Personnel", back_populates="encounters")

    problems = db.relationship("Problem",
                            secondary=problem_encounter_association_table,
                            back_populates="encounters")

    @property
    def duration(self):
        if self.start_time and self.end_time:
            return relativedelta(self.end_time, self.start_time)


    def add_problem(self, problem):
        """Add a problem to the encounter"""
        if self.patient != problem.patient:
            raise dbexception.AutoMODatabaseError("The Problem and Encounter should be from the same patient")

        if problem in self.problems:
            raise dbexception.AutoMODatabaseError("This problem already exists in this encounter")

        self.problems.append(problem)


    def remove_problem(self, problem):
        """Remove problem from the encounter. If problem has no other encounters, the problem is
          removed from the patient also. So each problem should be associated with at least one encounter"""
        if problem not in self.problems:
            raise dbexception.AutoMODatabaseError("Cannot remove a problem that is not associated with this encounter")
        
        self.problems.remove(problem)

        encounters_in_problem = len(problem.encounters)
        if encounters_in_problem == 0:
            #as no other encounters assoicated with this problem, remove it from the patient
            self.patient.problems.remove(problem)


    def add_child_encounter(self, encounter):
        """Add a child encounter"""
        encounter.patient = self.patient
        self.children.append(encounter)


    def remove_child_encounter(self, encounter):
        """Remove a child encounter"""
        if encounter in self.children:
            self.children.remove(encounter)
        if encounter in self.patient.encounters:
            self.patient.encounters.remove(encounter)


    def end(self, end_time=None):
        if self.end_time is not None:
            raise dbexception.AutoMODatabaseError("This encounter has already ended")
        if end_time is None:
            end_time = datetime.datetime.now()

        self.end_time = end_time


    def is_active(self):
        if self.end_time is None:
            return True
        return False
