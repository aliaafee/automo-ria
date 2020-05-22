"Hospital"
from flask import url_for

from .. import db

from .mixins import SerializerMixin, ValidatorMixin

class Hospital(SerializerMixin, ValidatorMixin ,db.Model):
    """The Hospital which has multiple wards/departments"""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'name',
        'address',
        'phone_no'
    ]

    #def url(self):
    #    return url_for('api.get_ward', ward_id=self.id, _external=True)


    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(250))
    address = db.Column(db.String(250))
    phone_no = db.Column(db.String(250))

    active = db.Column(db.Boolean, default=True)

    wards = db.relationship("Ward", back_populates="hospital")
    departments = db.relationship("Department", back_populates="hospital")
    