"""Administrative Utilities"""
from getpass import getpass
from faker import Faker
import random
from datetime import timedelta
from datetime import datetime

from flask_script import Command, Option

from .icd10import import import_icd10
from .models import User, Role, Patient, Address, Admission, Problem, Ward, Bed, Doctor
from . import db


class InstallCommand(Command):
    def get_options(self):
        options = (
            Option('-i', '--icd10',
                   dest='icd10_filename',
                   default=None),
        )
        return options

    def run(self, icd10_filename):
        print("Installing")
        print("----------")
        print("")

        db.create_all()
        Role.insert_roles()

        root = User()
        root.username = input("Administrator Username: ")
        root.password = getpass("Administrator Password: ")
        root.role = Role.query.filter_by(permissions=0xff).first()
        db.session.add(root)
        db.session.commit()
        print("Administrator Account Added")
        print("")
        if icd10_filename:
            print("Adding ICD10 Codes from {}".format(icd10_filename))
            import_icd10(icd10_filename, db.session)
            print("Done")
            print("")
        print("Installation Complete")


class FakeData(Command):
    def get_options(self):
        options = (
            Option('-d', '--doctors',
                   dest='doctors_count',
                   default=3),
            Option('-w', '--wards',
                   dest='wards_count',
                   default=3),
            Option('-p', '--patients',
                   dest='patients_count',
                   default=5),
            Option('-r', '--problems',
                   dest='problems_count',
                   default=5),
            Option('-e', '--encounters',
                   dest='encounters_count',
                   default=5)
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

        docs = []
        for i in range(doctors_count):
            doc = Doctor()
            doc.name = "Dr. {}".format(fake.name())
            doc.record_card_no = str(random.randint(1000,9999))
            db.session.add(doc)
            docs.append(doc)


        wards = []
        beds = []
        for i in range(wards_count):
            ward = Ward(name="Ward {}".format(i))
            ward.bed_prefix = "w{}".format(i)
            db.session.add(ward)
            wards.append(ward)
            for i in range(random.randint(10,15)):
                bed = Bed(number=str(i))
                db.session.add(bed)
                beds.append(bed)
                ward.beds.append(bed)


        for i in range(patients_count):
            patient = Patient()
            patient.name = fake.name()
            patient.time_of_birth = f_datetime()
            patient.permanent_address = address()
            patient.current_address = address()
            patient.phone_no = fake.phone_number()
            patient.sex = random.choice(["F", "M"])

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
                patient.discharge(
                    ad.start_time + timedelta(days=(random.randint(1, 10)))
                )

        db.session.commit()

        for patient in Patient.query.all():
            for adm in patient.encounters:
                for i in range(random.randint(1, 5)):
                    try:
                        adm.add_problem(random.choice(patient.problems))
                    except:
                        pass
                    db.session.commit()
