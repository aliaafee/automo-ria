"""Problem Encounter Association Table"""
from .. import db

problem_encounter_association_table = db.Table(
    'problem_encounter_association', db.Model.metadata,
    db.Column('problem_id', db.Integer, db.ForeignKey('problem.id')),
    db.Column('encounter_id', db.Integer, db.ForeignKey('encounter.id'))
)