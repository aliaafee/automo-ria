"""Preset Prescription"""
from .. import db


class PresetPrescription(db.Model):
    """Preset Drug Regimens"""
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(250))

    medications = db.relationship("PresetMedication", back_populates="preset", cascade="all, delete, delete-orphan")


class PresetMedication(db.Model):
    """Medication order in a drug regimen, duration is in days"""
    id = db.Column(db.Integer, primary_key=True)

    preset_id = db.Column(db.Integer, db.ForeignKey('presetprescription.id'))
    preset = db.relationship("PresetPrescription", back_populates="medications")

    drug_id = db.Column(db.Integer, db.ForeignKey('drug.id'))
    drug = db.relationship("Drug")
    drug_order = db.Column(db.String(250))
    active = db.Column(db.Boolean)
