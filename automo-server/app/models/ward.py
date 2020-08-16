"Ward"
from flask import url_for

from .. import db

from .mixins import SerializerMixin, ValidatorMixin

class Ward(SerializerMixin,ValidatorMixin ,db.Model):
    """Ward in the clinic/hospital, each ward has multiple beds"""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'name',
        'bed_prefix',
        'active',
    ]

    def url(self):
        return url_for('api.get_hospital_ward', hospital_id=self.hospital_id, ward_id=self.id, _external=True)
        #return url_for('api.get_ward', ward_id=self.id, _external=True)


    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(250))
    bed_prefix = db.Column(db.String(250))

    active = db.Column(db.Boolean, default=True)

    beds = db.relationship("Bed", back_populates="ward")

    hospital_id = db.Column(db.Integer, db.ForeignKey('hospital.id'))
    hospital = db.relationship("Hospital", back_populates="wards")
