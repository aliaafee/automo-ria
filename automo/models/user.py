"""Database User"""
from passlib.hash import pbkdf2_sha256
from flask_login import UserMixin

from .. import db#, login_manager

from .role import Role, Permission

class User(UserMixin, db.Model):
    """Database Users"""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))

    username = db.Column(db.String(60))
    fullname = db.Column(db.String(255))
    password_hash = db.Column(db.String(128))

    active = db.Column(db.Boolean, default=True)

    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'))
    personnel = db.relationship("Personnel", back_populates="user")

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.role is None:
            self.role = Role.query.filter_by(default=True).first()

    @property
    def complete_name(self):
        if self.personnel is not None:
            if self.personnel.name is not None:
                return self.personnel.name
        if self.fullname is not None:
            return self.fullname
        return self.username

    @property
    def password(self):
        """Prevent Password from being accessed"""
        raise AttributeError("Password is not a readable attribute")

    @password.setter
    def password(self, password):
        self.password_hash = pbkdf2_sha256.hash(password)

    def verify_password(self, password):
        """Verify password"""
        if self.password_hash is None:
            return False
        return pbkdf2_sha256.verify(password, self.password_hash)

    def can(self, permissions):
        if self.role is None:
            return False

        return (self.role.permissions & permissions) == permissions

    def is_administrator(self):
        return self.can(Permission.ADMINISTER)




#@login_manager.user_loader
#def load_user(user_id):
#    return User.query.get(int(user_id))
