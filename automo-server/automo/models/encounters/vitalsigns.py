"""Vital Signs"""
from ... import db
from .encounter import Encounter


class VitalSigns(Encounter):
    """Record Vital Signs.
      pulse_rate in beats per minute,
      respiratory_rate in breaths per minute,
      diastolic_bp and systolic_bp in mmHg, this is NIBP,
      temperature in degrees Celcius"""
    __tablename__ = "vitalsigns"
    
    id = db.Column(db.Integer, db.ForeignKey('encounter.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity':'vitalsigns',
    }

    label = "Vital Signs"

    serialized_attrs = [
        'id',
        'label',
        'type',
        'start_time',
        'pulse_rate',
        'respiratory_rate',
        'diastolic_bp',
        'systolic_bp',
        'temperature'
    ]

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

    pulse_rate = db.Column(db.Float)
    respiratory_rate = db.Column(db.Float)
    diastolic_bp = db.Column(db.Float)
    systolic_bp = db.Column(db.Float)
    temperature = db.Column(db.Float)


class VitalSignsExtended(VitalSigns):
    """Record extended vital signs. extended VitalSigns with more variables
      in addition to signs in VitalSigns.
      cvp (central venous pressure) in mmHg 
      systolic_ibp and diastolic_ibp in mmHg
      cap_spo2 in % (capillary spo2)"""
    __tablename__ = "vitalsignsextended"

    id = db.Column(db.Integer, db.ForeignKey('vitalsigns.id'), primary_key=True)
    
    __mapper_args__ = {
        'polymorphic_identity':'vitalsignsextended'
    }

    cvp = db.Column(db.Float)
    systolic_ibp = db.Column(db.Float)
    diastolic_ibp = db.Column(db.Float)
    cap_spo2 = db.Column(db.Float)
