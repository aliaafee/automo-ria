"""Complication Grades"""
from .. import db

class ComplicationGrade(db.Model):
    """Complication Grades, graded by clavian-dindo."""
    __tablename__ = "complicationgrade"

    id = db.Column(db.String(5), primary_key=True)

    description = db.Column(db.Text)

    admissions = db.relationship("Admission", back_populates="complication_grade",
                              foreign_keys="Admission.complication_grade_id")
