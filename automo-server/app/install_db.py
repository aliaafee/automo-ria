from . import db
from . import models as md
from .icd10import import import_icd10

def install_db(admin_username, admin_password, icd10_filename=None):
    print("Installing")
    print("----------")

    print("Creating Tables...")
    db.create_all()

    print("Generating User Roles")
    md.Role.insert_roles()

    print("Creating Administrator Account")
    admin = md.User()
    admin.username = admin_username
    admin.password = admin_password
    admin.role = md.Role.query.filter_by(permissions=0xff).first()
    db.session.add(admin)
    db.session.commit()

    if not icd10_filename:
        print("Installation Complete, Icd10 Codes not added.")
        return

    print("Adding Icd10 Codes from {}".format(icd10_filename))
    import_icd10(icd10_filename, db.session)

    print("Installation Complete")


    
    
