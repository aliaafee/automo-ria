"""Progress Note"""
from ... import db
from .encounter import Encounter


class Progress(Encounter):
    """Progress Note."""
    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'progress'
    }

    serialized_attrs = [
        'id',
        'label',
        'type',
        'start_time',
        'end_time',
        'personnel',
        'subjective',
        'objective',
        'assessment',
        'plan'
    ]

    label = "Progress Note"

    def set_examination_time(self, examination_time):
        """In this encounter start-time and end-time are same, use this attr
          to change both at the same time"""
        self.start_time = examination_time
        self.end_time = examination_time

    def get_examination_time(self):
        """In this encounter start-time and end-time are same, use this attr
          to change both at the same time"""
        return self.start_time

    examination_time = property(get_examination_time, set_examination_time, None,
                           "Time patient was examined.")

    subjective = db.Column(db.Text())

    objective = db.Column(db.Text())

    assessment = db.Column(db.Text())

    plan = db.Column(db.Text())
