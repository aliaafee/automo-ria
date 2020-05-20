"""Notes"""
from .. import db


class Note(db.Model):
    """The patient encounter notes. Parent class of all notes,
      there are multiple child classes, eg: Patient History,
      Progress notes, Examination notes. Can be extended with more
      child classes."""
    __versioned__ = {}
    
    id = db.Column(db.Integer, primary_key=True)

    type = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity':'note',
        'polymorphic_on':type
    }

    clinicalencounter_id = db.Column(db.Integer, db.ForeignKey('clinicalencounter.id'))
    clinicalencounter = db.relationship("ClinicalEncounter", back_populates="notes")


class History(Note):
    """Patient History Note"""
    id = db.Column(db.Integer, db.ForeignKey('note.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'history',
    }

    chief_complaints = db.Column(db.Text())
    presenting_illness = db.Column(db.Text())
    past = db.Column(db.Text())
