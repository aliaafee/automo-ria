"""Bed"""
from .. import db


class Bed(db.Model):
    """Bed in the clinic/hospital, each bed is associated with a HospitalStay,
      and a list of previous admissions in the bed."""
    id = db.Column(db.Integer, primary_key=True)

    number = db.Column(db.String(250))

    ward_id = db.Column(db.Integer, db.ForeignKey('ward.id'))
    ward = db.relationship("Ward", back_populates="beds")

    admission = db.relationship("Admission", uselist=False, back_populates="bed",
                             foreign_keys="Admission.bed_id")
    previous_admissions = db.relationship("Admission", back_populates="discharged_bed",
                                       foreign_keys="Admission.discharged_bed_id")
