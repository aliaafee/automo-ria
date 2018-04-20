"""Prescription"""
from .. import db

class Prescription(db.Model):
    """Patient Prescription"""
    __versioned__ = {}
    
    id = db.Column(db.Integer, primary_key=True)

    clinicalencounter_id = db.Column(db.Integer, db.ForeignKey('clinicalencounter.id'))
    clinicalencounter = db.relationship("Admission", back_populates="prescription")

    drug_id = db.Column(db.Integer, db.ForeignKey('drug.id'))
    drug = db.relationship("Drug", back_populates="prescriptions")
    drug_order = db.Column(db.String(250))
    active = db.Column(db.Boolean)