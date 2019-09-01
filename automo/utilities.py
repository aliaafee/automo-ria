"""Administrative Utilities"""
from getpass import getpass

from .icd10import import import_icd10
from .models import User, Role
from . import db

def install(icd10_filename=None):
    db.create_all()

    Role.insert_roles()

    root = User()
    root.username = input("Administrator Username: ")
    root.password = getpass("Administrator Password: ")
    root.role = Role.query.filter_by(permissions=0xff).first()

    db.session.add(root)

    db.session.commit()
    print("Administrator Account Added")

    if icd10_filename:
        import_icd10(icd10_filename, db.session)





