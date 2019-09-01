from .. import db

class Permission:
    VIEW = 0x01
    ADD = 0x02
    REMOVE = 0x03
    ADMINISTER = 0x80

class Role(db.Model):
    """User Roles"""
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(60))
    default = db.Column(db.Boolean, default=False, index=True)

    permissions = db.Column(db.Integer)

    users = db.relationship('User', backref='role', lazy='dynamic')


    @staticmethod
    def insert_roles():
        roles = {
            'User' : (Permission.VIEW | Permission.ADD | Permission.REMOVE, True),
            'Administrator' : (0xff, False)
        }
        for r in roles:
            role = Role.query.filter_by(name=r).first()
            if role is None:
                role = Role(name=r)
            role.permissions, role.default = roles[r]
            db.session.add(role)
        db.session.commit()
