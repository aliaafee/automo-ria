"""Administrative Utilities"""
from getpass import getpass

from .icd10import import import_icd10
from .models import User

def install(db, icd10_filename):
    db.create_all()

    root = User()
    root.username = input("Administrator Username: ")
    root.password = getpass("Administrator Password: ")

    db.session.add(root)

    db.session.commit()
    print("Administrator Account Added")

    import_icd10(icd10_filename, db.session)





