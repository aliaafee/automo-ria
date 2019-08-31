"""Addresses of patients"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .. import db


class Address(db.Model):
    """Patient addresses"""
    __versioned__ = {}

    id = db.Column(db.Integer, primary_key=True)

    line_1 = db.Column(db.String(255))
    line_2 = db.Column(db.String(255))
    line_3 = db.Column(db.String(255))
    city = db.Column(db.String(255))
    region = db.Column(db.String(255))
    country = db.Column(db.String(255))

    permanent_residents = relationship("Patient", back_populates="permanent_address",
                                       foreign_keys="Patient.permanent_address_id")
    
    current_residents = relationship("Patient", back_populates="current_address",
                                       foreign_keys="Patient.current_address_id")