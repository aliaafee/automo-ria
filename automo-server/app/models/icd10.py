"""Icd10 Classification"""
from .. import db
from .mixins import SerializerMixin

class Icd10Modifier(SerializerMixin, db.Model):
    """Icd10 Modifiers of classes"""
    __tablename__ = "icd10modifier"

    serialized_attrs = [
        'code',
        'name',
        'text'
    ]

    code = db.Column(db.String(10), primary_key=True)

    name = db.Column(db.String(250))

    text = db.Column(db.Text())
    note = db.Column(db.Text())
    classes = db.relationship("Icd10ModifierClass")


class Icd10ModifierClass(SerializerMixin, db.Model):
    """Icd10 Individual Modifier Codes"""
    __tablename__ = "icd10modifierclass"

    serialized_attrs = [
        'code',
        'code_short',
        'preferred',
        'modifier_code'
    ]

    code = db.Column(db.String(20), primary_key=True)

    code_short = db.Column(db.String(10))

    preferred = db.Column(db.String(250))
    definition = db.Column(db.Text())
    inclusion = db.Column(db.Text())
    exclusion = db.Column(db.Text())

    modifier_code = db.Column(db.String(10), db.ForeignKey('icd10modifier.code'))
    modifier = db.relationship("Icd10Modifier", back_populates="classes")


class Icd10Class(SerializerMixin, db.Model):
    """Icd10 chapters, blocks and categories as a tree structure"""
    __tablename__ = "icd10class"

    serialized_attrs = [
        'code',
        'preferred_plain',
        'preferred_long'
    ]

    code = db.Column(db.String(10), primary_key=True)

    kind = db.Column(db.Enum("chapter", "block", "category"))

    preferred_plain = db.Column(db.String(250))

    preferred = db.Column(db.String(250))
    preferred_long = db.Column(db.Text())
    inclusion = db.Column(db.Text())
    exclusion = db.Column(db.Text())
    text = db.Column(db.Text())
    note = db.Column(db.Text())
    coding_hint = db.Column(db.Text())

    usage = db.Column(db.Enum("dagger", "aster"), name="usage")

    modifier_code = db.Column(db.String(10), db.ForeignKey('icd10modifier.code'))
    modifier = db.relationship("Icd10Modifier", foreign_keys=[modifier_code])

    modifier_extra_code = db.Column(db.String(10), db.ForeignKey('icd10modifier.code'))
    modifier_extra = db.relationship("Icd10Modifier", foreign_keys=[modifier_extra_code])

    parent_code = db.Column(db.String(10), db.ForeignKey("icd10class.code"))
    children = db.relationship('Icd10Class',
                            backref=db.backref("parent", remote_side='Icd10Class.code'))

    chapter_code = db.Column(db.String(10))
    parent_block_code = db.Column(db.String(10))

    problems = db.relationship("Problem", back_populates="icd10class")
