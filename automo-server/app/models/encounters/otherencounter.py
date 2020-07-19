"""Other Encounter"""
from ... import db
from .encounter import Encounter


class OtherEncounter(Encounter):
    """Other Encounter
      To Record encounters that have not been specified elsewhere"""
    __tablename__ = "otherencounter"

    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'otherencounter'
    }

    serialized_attrs = [
        'id',
        'label',
        'type',
        'start_time',
        'end_time',
        'personnel',
        'title',
        'note'
    ]

    label = "Other Encounter"

    title = db.Column(db.String(255))
    note = db.Column(db.Text())