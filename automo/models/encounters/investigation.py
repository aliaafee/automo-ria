"""Investigation"""
from ... import db
from .encounter import Encounter


class Investigation(Encounter):
    """Investigation"""
    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'investigation',
    }

    label = "Investigation"

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


class Imaging(Investigation):
    """Imaging."""
    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'imaging'
    }

    label = "Imaging"

    site = db.Column(db.String(255))
    imaging_type = db.Column(db.String(255))
    report = db.Column(db.Text)
    impression = db.Column(db.Text)
    radiologist = db.Column(db.String(255))


class Endoscopy(Investigation):
    """Endoscopy."""
    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'endoscopy'
    }

    label = "Endoscopy"

    site = db.Column(db.String(255))
    report = db.Column(db.Text)
    impression = db.Column(db.Text)
    endoscopist = db.Column(db.String(255))


class Histopathology(Investigation):
    """Histopathology."""
    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'histopathology'
    }

    label = "Histopathology"

    site = db.Column(db.String(255))
    report = db.Column(db.Text)
    impression = db.Column(db.Text)
    pathologist = db.Column(db.String(255))


class OtherReport(Investigation):
    """Report of Investigation Not Applicable Elsewhere."""
    __tablename__ = "otherreport"

    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'otherreport'
    }

    label = "Other Report"

    name = db.Column(db.String(255))
    report = db.Column(db.Text)
    impression = db.Column(db.Text)
    reported_by = db.Column(db.String(255))


class CompleteBloodCount(Investigation):
    """CompleteBloodCount.
      hemoglobin (Hemoglobin) in g% 
      tlc (Total Leucocyte Count) 10^9/L
      plt (Platelate Count) 10^9/L
      dlc_n (DLC Nutrophils) %
      dlc_l (DLC Lymphocytes) %
      dlc_m (DLC Monocytes) %
      dlc_e (DLC Monocytes) %"""
    __tablename__ = "completebloodcount"

    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'completebloodcount'
    }

    label = "Complete Blood Count"

    hemoglobin = db.Column(db.Float)
    tlc = db.Column(db.Float)
    plt = db.Column(db.Float)
    dlc_n = db.Column(db.Float)
    dlc_l = db.Column(db.Float)
    dlc_m = db.Column(db.Float)
    dlc_e = db.Column(db.Float)


class RenalFunctionTest(Investigation):
    """RenalFunctionTest.
      urea (Serum Urea) mmol/L
      creatinine (Serum Creatinine) mmol/L"""
    __tablename__ = "renalfunctiontest"

    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'renalfunctiontest'
    }

    label = "Renal Function Test"

    urea = db.Column(db.Float)
    creatinine = db.Column(db.Float)


class LiverFunctionTest(Investigation):
    """LiverFunctionTest.
      t_bil (Total Billirubin) mmol/L
      d_bil (Direct Billirubin) mmol/L
      alt (Alanine Amino Transferase) U/L
      ast (Aspartate Amino Transferase) U/L
      alp (Alkaline Phosphatase) U/L"""
    __tablename__ = "liverfunctiontest"

    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'liverfunctiontest'
    }

    label = "Liver Function Test"

    t_bil = db.Column(db.Float)
    d_bil = db.Column(db.Float)
    alt = db.Column(db.Float)
    ast = db.Column(db.Float)
    alp = db.Column(db.Float)


class OtherTest(Investigation):
    """Other Test.
      name Name of the test
      value Result of the test, can be numerical or text
      unit Unit of the result, if applicable"""
    __tablename__ = "othertest"

    id = db.Column(db.Integer, db.ForeignKey('investigation.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'othertest'
    }

    label = "Other Test"

    name = db.Column(db.String(255))
    value = db.Column(db.String(255))
    unit = db.Column(db.String(255))

