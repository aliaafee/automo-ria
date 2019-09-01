"Ward"
from .. import db

class Ward(db.Model):
    """Ward in the clinic/hospital, each ward has multiple beds"""
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(250))
    bed_prefix = db.Column(db.String(250))

    active = db.Column(db.Boolean, default=True)

    beds = db.relationship("Bed", back_populates="ward")
