"""Clinical Encounter"""
from flask import url_for

from ... import db

from .encounter import Encounter
from .. import dbexception
from ..drug import Drug
from ..prescription import Prescription
from .surgicalprocedure import SurgicalProcedure


class ClinicalEncounter(Encounter):
    """Base class of all clinical encounters, which are admissions and outpatient
      enconters. Each clinicalencounter is associated with a prescription"""
    __tablename__ = 'clinicalencounter'
    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'clinicalencounter',
    }

    serialized_attrs = [
        'id',
        'label',
        'type',
        'start_time',
        'end_time',
        'personnel',
        'problems'
    ]

    label = "Clinical Encounter"

    chief_complaints = db.Column(db.Text)
    history = db.Column(db.Text)
    past_history = db.Column(db.Text)

    general_inspection = db.Column(db.Text)
    exam_head = db.Column(db.Text)
    exam_neck = db.Column(db.Text)
    exam_chest = db.Column(db.Text)
    exam_abdomen = db.Column(db.Text)
    exam_genitalia = db.Column(db.Text)
    exam_pelvic_rectal = db.Column(db.Text)
    exam_extremities = db.Column(db.Text)
    exam_other = db.Column(db.Text)

    notes = db.relationship("Note", back_populates="clinicalencounter",
                         cascade="all, delete, delete-orphan")

    prescription = db.relationship("Prescription", back_populates="clinicalencounter",
                                cascade="all, delete, delete-orphan")

    written_by = db.Column(db.String(255))

    @property
    def initial_vitalsigns(self):
        return None

    def prescribe_drug(self, drug, drug_str, drug_order, active=True):
        """Precribe medication. Drug can be passed as an object, or object can be None
          and a string name of Drug can be passed. If this string name not found in drug list
          it will be added."""
        new_presc = self._create_new_prescription(drug, drug_str, drug_order)
        self.prescription.append(new_presc)
        return new_presc

    def _create_new_prescription(self, drug, drug_str, drug_order, active=True):
        if drug is None:
            if drug_str == "":
                raise dbexception.AutoMODatabaseError("New drug name cannot be empty")
            query = db.session.query(Drug)\
                        .filter(Drug.name == drug_str)
            if query.count() == 0:
                new_drug = Drug(
                    name = drug_str
                )
                db.session.add(new_drug)
                drug = new_drug
            else:
                drug = query.first()
        new_presc = Prescription(
            drug = drug,
            drug_order = drug_order,
            active = active
        )
        return new_presc




class Admission(ClinicalEncounter):
    """Admission Encounter. Each hospital stay is associated with a bed, when the
      patient is discharged after the hospital stay, the bed attribute is cleared and the bed
      number is moved to the discharged_bed attribute."""

    serialized_attrs = [
        'id',
        'label',
        'type',
        'bed',
        'discharged_bed',
        'type',
        'start_time',
        'end_time',
        'personnel',
        'problems'
    ]

    def url(self):
        return url_for(
            'api.get_patient_admission',
            patient_id=self.patient_id,
            admission_id=self.id,
            _external=True
        )


    id = db.Column(db.Integer, db.ForeignKey('clinicalencounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'admission',
    }

    label = "Admission"

    bed_id = db.Column(db.Integer, db.ForeignKey('bed.id'))
    bed = db.relationship("Bed", foreign_keys=[bed_id], back_populates="admission")

    discharged_bed_id = db.Column(db.Integer, db.ForeignKey('bed.id'))
    discharged_bed = db.relationship("Bed", foreign_keys=[discharged_bed_id],
                                  back_populates="previous_admissions")

    hospital_course = db.Column(db.Text)
    discharge_advice = db.Column(db.Text)
    follow_up = db.Column(db.Text)

    complication_grade_id = db.Column(db.String(5), db.ForeignKey('complicationgrade.id'))
    complication_grade = db.relationship("ComplicationGrade", foreign_keys=[complication_grade_id],
                                      back_populates="admissions")
    complication_summary = db.Column(db.Text)
    complication_disability = db.Column(db.Boolean)


    def end(self, end_time=None):
        """Ends the admission"""

        """
        if self.complication_grade_id is None:
            surgical_enounters = session.query(SurgicalProcedure)\
                                    .filter(SurgicalProcedure.parent == self)
            if surgical_enounters.count() == 0:
                print("No surgical procedures so None complication grade allowed")
            else:
                raise dbexception.AutoMODatabaseError("Surgical Complication Grade should be assigned before discharge.")
                return
        """
        
        super(Admission, self).end(end_time)

        self.discharged_bed = self.bed
        self.bed = None



class CircumcisionAdmission(Admission):
    """Admission Encounter. Each hospital stay is associated with a bed, when the
      patient is discharged after the hospital stay, the bed attribute is cleared and the bed
      number is moved to the discharged_bed attribute."""
    __tablename__ = 'circumcisionadmission'
    id = db.Column(db.Integer, db.ForeignKey('admission.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'circumcisionadmission',
    }

    label = "Circumcision"

    preoperative_orders = db.Column(db.Text)



class OutpatientEncounter(ClinicalEncounter):
    """Visit to outpatient clinic"""
    __tablename__ = 'outpatientencounter'

    id = db.Column(db.Integer, db.ForeignKey('clinicalencounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'outpatientencounter',
    }

    label = "Outpatient"

    room = db.Column(db.String(50))
