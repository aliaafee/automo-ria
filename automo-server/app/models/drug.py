"Drug"
from .. import db
from .mixins import SerializerMixin, ValidatorMixin

class Drug(db.Model, SerializerMixin, ValidatorMixin):
    """Drugs"""
    __versioned__ = {}

    serialized_attrs = [
        'name'
    ]
    
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(250))

    prescriptions = db.relationship("Prescription", back_populates="drug")

    def merge_with(self, session, drugs):
        """Merges duplicate drug entries into one"""
        prescriptions = []
        for drug in drugs:
            if drug.prescriptions:
                prescriptions.extend(drug.prescriptions)
        for prescription in prescriptions:
            prescription.drug = self
        for drug in drugs:
            session.delete(drug)
