"""Addresses of patients"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from flask import url_for

from .. import db
from .mixins import SerializerMixin, ValidatorMixin

class Address(SerializerMixin, ValidatorMixin, db.Model):
    """Patient addresses"""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'line_1',
        'line_2',
        'line_3',
        'city',
        'region',
        'country',
        'phone_no'
    ]

    def url(self):
        return url_for('api.get_address', address_id=self.id, _external=True)


    id = db.Column(db.Integer, primary_key=True)

    line_1 = db.Column(db.String(255))
    line_2 = db.Column(db.String(255))
    line_3 = db.Column(db.String(255))
    city = db.Column(db.String(255))
    region = db.Column(db.String(255))
    country = db.Column(db.String(255))
    phone_no = db.Column(db.String(250))


    permanent_residents = relationship("Patient", back_populates="permanent_address",
                                       foreign_keys="Patient.permanent_address_id")
    
    current_residents = relationship("Patient", back_populates="current_address",
                                       foreign_keys="Patient.current_address_id")
