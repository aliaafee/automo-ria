"""Personnel"""
from .. import db
from .mixins import SerializerMixin, ValidatorMixin


class Personnel(db.Model, SerializerMixin, ValidatorMixin):
    """Health Facility Personnel"""
    __versioned__ = {}

    serialized_attrs = [
        'id',
        'name',
        'record_card_no',
        'department'
    ]
    
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

    department_id = db.Column(db.Integer, db.ForeignKey('department.id'))
    department = db.relationship("Department", back_populates="personnel")

    user = db.relationship("User", uselist=False, back_populates="personnel",
                        foreign_keys="User.personnel_id")

    @property
    def complete_name(self):
        if self.record_card_no == None:
            return self.name
        return '{} ({})'.format(self.name, self.record_card_no)


class Doctor(Personnel):
    """Doctors."""
    id = db.Column(db.Integer, db.ForeignKey('personnel.id'), primary_key=True)

    serialized_attrs = [
        'id',
        'name',
        'record_card_no',
        'pmr_no',
        'department'
    ]

    __mapper_args__ = {
        'polymorphic_identity':'doctor',
    }

    pmr_no = db.Column(db.String(250))

    @property
    def complete_name(self):
        if self.pmr_no == None:
            return self.name
        return '{} ({})'.format(self.name, self.pmr_no)


class MedicalOfficer(Personnel):
    """Medical Officers."""
    __tablename__ = "medicalofficer"

    id = db.Column(db.Integer, db.ForeignKey('personnel.id'), primary_key=True)

    serialized_attrs = [
        'id',
        'name',
        'record_card_no',
        'pmr_no',
        'department'
    ]

    __mapper_args__ = {
        'polymorphic_identity':'medicalofficer',
    }

    pmr_no = db.Column(db.String(250))

    @property
    def complete_name(self):
        if self.pmr_no == None:
            return self.name
        return '{} ({})'.format(self.name, self.pmr_no)


class Nurse(Personnel):
    """Nurses."""
    id = db.Column(db.Integer, db.ForeignKey('personnel.id'), primary_key=True)

    serialized_attrs = [
        'id',
        'name',
        'record_card_no',
        'pnr_no',
        'department'
    ]

    __mapper_args__ = {
        'polymorphic_identity':'nurse',
    }

    pnr_no = db.Column(db.String(250))

    @property
    def complete_name(self):
        if self.pmr_no == None:
            return self.name
        return '{} ({})'.format(self.name, self.pnr_no)
