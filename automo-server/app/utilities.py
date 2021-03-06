"""Administrative Utilities"""
import click
from faker import Faker
import random
from datetime import timedelta
from datetime import datetime

from flask_script import Command, Option

from waitress import serve

from .icd10import import import_icd10
from .models import User, Role, Patient, Address, Admission, Problem, Ward, Bed, Doctor, VitalSigns, SurgicalProcedure, RenalFunctionTest, ClinicalEncounter, PhoneNumber
from . import models as md 

from .install_db import install_db

from . import db


class Serve(Command):
    """
        Serve with Waitress
    """
    def get_options(self):
        #TODO: Add all Waitress Serve Options
        return (
            Option('-h', '--host',
                    dest='host',
                    default='127.0.0.1'),
            Option('-p', '--port',
                    dest='port',
                    default='8080')
        )
    
    def __call__(self, app, host, port):
         serve(
             app,
             host=host,
             port=port
         )




class InstallCommand(Command):
    """
        Install the database, -i, --ic10 option should point to icd10 xml file
    """
    def get_options(self):
        options = (
            Option('-i', '--icd10',
                   dest='icd10_filename',
                   default=None),
        )
        return options

    def run(self, icd10_filename):

        username = click.prompt("Administrator Username", type=str, default="admin", show_default=True)
        password = click.prompt("Administrator Password", hide_input=True)

        install_db(
            username,
            password,
            icd10_filename
        )

        return


class FakeData(Command):
    def get_options(self):
        options = (
            Option('-d', '--doctors',
                   dest='doctors_count',
                   default=3,
                   type=int),
            Option('-w', '--wards',
                   dest='wards_count',
                   default=3,
                   type=int),
            Option('-p', '--patients',
                   dest='patients_count',
                   default=5,
                   type=int),
            Option('-r', '--problems',
                   dest='problems_count',
                   default=5,
                   type=int),
            Option('-e', '--encounters',
                   dest='encounters_count',
                   default=5,
                   type=int)
        )
        return options


    def run(self, doctors_count, wards_count, patients_count, problems_count, encounters_count):
        fake = Faker()

        def address():
            add = Address()
            add_str = fake.address().split('\n')
            add.line_1 = add_str[0]
            add.city = add_str[1].split(",")[0]
            try:
                add.region = add_str[1].split(",")[1]
            except:
                pass
            add.country = fake.country()
            return add

        def f_datetime():
            f = fake.date_object()
            d = datetime(year=f.year, month=f.month, day=f.day)
            return d

        def f_icd10class():
            pass

        total_progress = doctors_count + wards_count + patients_count + patients_count

        with click.progressbar(length=total_progress, label="Faking Data") as bar:
            hosp = md.Hospital()
            hosp.name = "Some Big Hospital"
            hosp.address = "Big Street, Sometown, Country"
            hosp.phone_no = "9801243, 8731294"
            db.session.add(hosp)

            dept = md.Department()
            dept.name = "Department of Surgery"
            hosp.departments.append(dept)


            docs = []
            for i in range(doctors_count):
                doc = Doctor()
                doc.name = "Dr. {}".format(fake.name())
                doc.record_card_no = str(random.randint(1000,9999))
                db.session.add(doc)
                dept.personnel.append(doc)
                docs.append(doc)
                bar.update(1)


            wards = []
            beds = []
            for i in range(wards_count):
                ward = Ward(name="Ward {}".format(i))
                ward.bed_prefix = "w{}".format(i)
                db.session.add(ward)
                hosp.wards.append(ward)
                wards.append(ward)
                for i in range(random.randint(10,15)):
                    bed = Bed(number=str(i))
                    db.session.add(bed)
                    beds.append(bed)
                    ward.beds.append(bed)
                bar.update(1)


            for i in range(patients_count):
                patient = Patient()
                patient.national_id_no = 'A{}'.format(random.randint(100000,999999));
                patient.hospital_no = '{}'.format(random.randint(100000, 999999))
                patient.name = fake.name()
                patient.time_of_birth = f_datetime()
                patient.permanent_address = address()
                patient.current_address = address()
                patient.phone_no = fake.phone_number()
                patient.sex = random.choice(["F", "M"])

                for i in range(1, random.randint(3, 5)):
                    ph = PhoneNumber()
                    ph.name = fake.name()
                    ph.number = fake.phone_number()
                    patient.phone_numbers.append(ph)

                db.session.add(patient)

                for i in range(random.randint(1,problems_count)):
                    p = Problem()
                    p.icd10class_code = random.choice(["A","B","C"]) + "0" + str(random.randint(1,9))
                    p.start_time = f_datetime()
                    db.session.add(p)
                    patient.problems.append(p)


                for i in range(random.randint(1,encounters_count)):
                    ad = patient.admit(
                        random.choice(docs),
                        random.choice(beds),
                        f_datetime()
                    )

                    for field in ['chief_complaints', 'history', 'past_history', 'general_inspection', 'exam-head', 'exam_neck', 'exam_chest', 'exam_abdomen', 'exam_genitalia', 'exam_pelvic_rectal',  'exam_extremities', 'exam_other']:
                        setattr(ad, field, fake.paragraph() + fake.paragraph() + fake.paragraph() + fake.paragraph())


                    e = VitalSigns()
                    e.pulse_rate = random.randint(60, 100)
                    e.diastolic_bp = random.randint(50, 60)
                    e.systolic_bp = e.diastolic_bp + random.randint(0, 60)
                    ad.add_child_encounter(e)
                    
                    for i in range(random.randint(0, 5)):
                        ch = random.choice([1,2,3])
                        e = None
                        if ch == 1:
                            e = VitalSigns()
                            e.pulse_rate = random.randint(60, 100)
                            e.diastolic_bp = random.randint(50, 60)
                            e.systolic_bp = e.diastolic_bp + random.randint(0, 60)
                        elif ch == 2:
                            e = SurgicalProcedure()
                            e.personnel = random.choice(docs)
                        else:
                            e = RenalFunctionTest()
                            e.creatinine = random.randint(40, 120)
                        ad.add_child_encounter(e)
                    patient.discharge(
                        ad.start_time + timedelta(days=(random.randint(1, 10)))
                    )
                bar.update(1)

            db.session.commit()

            for patient in Patient.query.all():
                for adm in ClinicalEncounter.query.filter_by(patient=patient):
                    for i in range(random.randint(1, 5)):
                        try:
                            adm.add_problem(random.choice(patient.problems))
                        except:
                            pass
                        db.session.commit()
                bar.update(1)
