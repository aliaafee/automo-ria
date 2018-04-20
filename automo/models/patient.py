"""Patient"""
import string
import datetime
import dateutil.relativedelta

from .. import db
from .encounters import Encounter, Admission, Measurements


class Patient(db.Model):
    """Patient demographic data and list of problems and encounters of the patient.
      Each patient also has single prescription of medications that have been adviced for the
      patient."""
    __versioned__ = {}
    
    id = db.Column(db.Integer, primary_key=True)

    hospital_no = db.Column(db.String(10))
    national_id_no = db.Column(db.String(10))
    name = db.Column(db.String(250))
    time_of_birth = db.Column(db.DateTime())
    time_of_death = db.Column(db.DateTime())
    sex = db.Column(db.String(1))

    allergies = db.Column(db.Text)

    phone_no = db.Column(db.String(250))

    permanent_address_id = db.Column(db.Integer, db.ForeignKey('address.id'))
    permanent_address = db.relationship("Address", foreign_keys=[permanent_address_id],
                                     back_populates="permanent_residents")

    current_address_id = db.Column(db.Integer, db.ForeignKey('address.id'))
    current_address = db.relationship("Address", foreign_keys=[current_address_id],
                                   back_populates="current_residents")

    problems = db.relationship("Problem", back_populates="patient",
                            cascade="all, delete, delete-orphan")

    encounters = db.relationship("Encounter", back_populates="patient",
                              cascade="all, delete, delete-orphan")

    active = db.Column(db.Boolean)

    def set_age(self, age, now=None):
        """Set age of patient as relativedelta, age is not acctually stored,
          date of birth is calculated and stored"""
        if now is None:
            now = datetime.datetime.now()
        self.time_of_birth = now - age

    def get_age(self, now=None):
        """Calculate and return age of patient as a relativedelta object"""
        if self.time_of_birth is None:
            return None
        if now is None:
            now = datetime.datetime.now()
        if self.time_of_death is not None:
            if now > self.time_of_death:
                return None
        return dateutil.relativedelta.relativedelta(now, self.time_of_birth)

    age = property(get_age, set_age, None, "Age of the patient as relativedelta.")

    @property
    def age_td(self):
        """Age as a timedelta"""
        return datetime.date.today() - self.time_of_birth


    def get_current_encounter(self, session=db.session):
        """Get currently active encounter, an encounter is active when the end_time is None,
          Only one encounter should be active at a time. If a singe active enounter is not
          found raises AutoMODatabaseError"""
        active_encounters = session.query(Encounter)\
                                .filter(Encounter.patient == self)\
                                .filter(Encounter.parent == None)\
                                .filter(Encounter.end_time == None)

        if active_encounters.count() == 1:
            return active_encounters.one()
        elif active_encounters.count() > 1:
            raise dbexception.AutoMODatabaseError("Multiple active Encounters for patient found. This should not happen.")
        else:
            return None


    def admit(self, doctor, bed, admission_time=None, admission_class=Admission, session=db.session):
        """Admit the patient to the provided bed. If patient is already admitted or the bed
          is occupied, raises AutoMODatabaseError. Returns the created encounter object."""
        current_encounter = self.get_current_encounter(session)
        if current_encounter is not None:
            raise dbexception.AutoMODatabaseError("There is an active encounter, end it before admitting.")

        if bed.admission is not None:
            raise dbexception.AutoMODatabaseError("Bed {0} is already occupied.".format(bed))

        if doctor.type != 'doctor':
            raise dbexception.AutoMODatabaseError("Patient can only be admitted under a doctor.")

        if admission_time is None:
            admission_time = datetime.datetime.now()

        new_admission = admission_class(
            patient = self,
            personnel = doctor,
            bed = bed,
            start_time = admission_time
        )

        session.add(new_admission)

        return new_admission


    def admit_circumcision(self, doctor, bed, admission_time=None, session=db.session):
        new_admission = self.admit(session, doctor, bed, admission_time=admission_time,
                                   admission_class=CircumcisionAdmission)
        new_admission.chief_complaints = config.CIRCUM_CHIEF_COMPLAINT
        new_admission.preoperative_orders = config.CIRCUM_PREOP_ORDERS
        new_admission.discharge_advice = config.CIRCUM_DISCHARGE_ADVICE
        new_admission.follow_up = config.CIRCUM_FOLLOW_UP

        problem = Problem()
        problem.icd10class_code = "Z41.2"
        problem.start_time = new_admission.start_time
        self.problems.append(problem)
        new_admission.add_problem(problem)

        surgery = SurgicalProcedure()
        surgery.personnel = doctor
        surgery.start_time =  new_admission.start_time.date() + datetime.timedelta(days=1)
        surgery.preoperative_diagnosis = "Circumcision"
        surgery.postoperative_diagnosis = "Circumcision"
        surgery.procedure_name = "Circumcision"
        surgery.findings = ""
        surgery.steps = ""
        new_admission.add_child_encounter(surgery)

        meds = string.split(config.CIRCUM_MEDS, ";")

        for med in meds:
            if med != "":
                new_admission.prescribe_drug(session, None, med, "")

        return new_admission


    def discharge(self, discharge_time=None, admission=None, session=db.session):
        """End the currently active admission, raises AutoMODatabase Error if their is no
          active admission"""
        if admission is None:
            current_encounter = self.get_current_encounter(session)
            if current_encounter is None:
                raise dbexception.AutoMODatabaseError("Patient has no active admissions.")
            if current_encounter.type not in ["admission", "circumcisionadmission"]:
                raise dbexception.AutoMODatabaseError("Current encounter is not an admission")
            admission = current_encounter

        if discharge_time is None:
            discharge_time = datetime.datetime.now()

        admission.end(session, discharge_time)


    def add_encounter(self, encounter):
        """Add an encounter to the patient"""
        self.encounters.append(encounter)


    def latest_measurments(self, session=db.session):
        weight = None
        measurements = session.query(Measurements)\
                            .filter(Measurements.patient == self)\
                            .filter(Measurements.weight != None)\
                            .order_by(Measurements.start_time.desc())\
                            .limit(1)
        if measurements.count() == 1:
            measurement = measurements.one()
            weight = measurement.weight

        height = None
        measurements = session.query(Measurements)\
                            .filter(Measurements.patient == self)\
                            .filter(Measurements.height != None)\
                            .order_by(Measurements.start_time.desc())\
                            .limit(1)
        if measurements.count() == 1:
            measurement = measurements.one()
            height = measurement.height

        return Measurements(weight=weight, height=height)
