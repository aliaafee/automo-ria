"""Measurements"""
from ... import db

from .encounter import Encounter


class Measurements(Encounter):
    """Record Anthropometric Measurements
      weight in kg, height in m"""
    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'measurements'
    }

    serialized_attrs = [
        'id',
        'label',
        'type',
        'start_time',
        'personnel',
        'weight',
        'height'
    ]

    label = "Measurement"

    def set_record_time(self, record_time):
        """In this encounter start-time and end-time are same, use this attr
          to change both at the same time"""
        self.start_time = record_time
        self.end_time = record_time

    def get_record_time(self):
        """In this encounter start-time and end-time are same, use this attr
          to change both at the same time"""
        return self.start_time

    record_time = property(get_record_time, set_record_time, None,
                           "Time this parameter was recorded.")

    weight = db.Column(db.Float)
    height = db.Column(db.Float)

    @property
    def bmi(self):
        if self.height == 0 or self.height is None:
            return None
        if self.weight == 0 or self.weight is None:
            return None
        return self.weight / (self.height ** 2)
