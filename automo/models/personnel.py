"""Personnel"""
from .. import db


class Personnel(db.Model):
    """Health Facility Personnel"""
    id = db.Column(db.Integer, primary_key=True)

    type = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity':'personnel',
        'polymorphic_on':type
    }

    record_card_no = db.Column(db.String(250))
    name = db.Column(db.String(250))

    active = db.Column(db.Boolean, default=True)

    encounters = db.relationship("Encounter", back_populates="personnel")

    user = db.relationship("User", uselist=False, back_populates="personnel",
                        foreign_keys="User.personnel_id")


class Doctor(Personnel):
    """Doctors."""
    id = db.Column(db.Integer, db.ForeignKey('personnel.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'doctor',
    }

    pmr_no = db.Column(db.String(250))


class MedicalOfficer(Personnel):
    """Medical Officers."""
    __tablename__ = "medicalofficer"

    id = db.Column(db.Integer, db.ForeignKey('personnel.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'medicalofficer',
    }

    pmr_no = db.Column(db.String(250))


class Nurse(Personnel):
    """Nurses."""
    id = db.Column(db.Integer, db.ForeignKey('personnel.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'nurse',
    }

    pnr_no = db.Column(db.String(250))
