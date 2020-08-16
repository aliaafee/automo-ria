"Department"
from flask import url_for

from .. import db

from .mixins import SerializerMixin, ValidatorMixin

class Department(SerializerMixin,ValidatorMixin ,db.Model):
    """Department in the clinic/hospital, each department has multiple personnel"""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'name',
        'active',
    ]

    def url(self):
        return url_for('api.get_hospital_department', department_id=self.id, hospital_id=self.hospital.id, _external=True)


    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(250))

    active = db.Column(db.Boolean, default=True)

    personnel = db.relationship("Personnel", back_populates="department")

    hospital_id = db.Column(db.Integer, db.ForeignKey('hospital.id'))
    hospital = db.relationship("Hospital", back_populates="departments")
