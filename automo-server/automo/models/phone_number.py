"""Phone"""
from flask import url_for

from .. import db
from . import dbexception
from .mixins import SerializerMixin, ValidatorMixin

class PhoneNumber(SerializerMixin, ValidatorMixin, db.Model):
    """Patients Phone Numbers"""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'name',
        'number'
    ]

    def url(self):
        return url_for('api.get_patient_phone_number', phone_number_id=self.id, patient_id=self.patient_id, _external=True)

    id = db.Column(db.Integer, primary_key=True)
    
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'))
    patient = db.relationship("Patient", back_populates="phone_numbers")

    name = db.Column(db.String(250))
    number = db.Column(db.String(250))