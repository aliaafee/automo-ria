"""Bed"""
from flask import url_for

from .. import db

from .mixins import SerializerMixin, ValidatorMixin


class Bed(SerializerMixin, ValidatorMixin, db.Model):
    """Bed in the clinic/hospital, each bed is associated with a HospitalStay,
      and a list of previous admissions in the bed."""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'number',
        'ward_id',
        'ward',
        #'admission'
    ]

    def url(self):
        return url_for('api.get_bed', bed_id=self.id, _external=True)

    id = db.Column(db.Integer, primary_key=True)

    number = db.Column(db.String(250))

    ward_id = db.Column(db.Integer, db.ForeignKey('ward.id'))
    ward = db.relationship("Ward", back_populates="beds")

    admission = db.relationship("Admission", uselist=False, back_populates="bed",
                             foreign_keys="Admission.bed_id")
    previous_admissions = db.relationship("Admission", back_populates="discharged_bed",
                                       foreign_keys="Admission.discharged_bed_id")
