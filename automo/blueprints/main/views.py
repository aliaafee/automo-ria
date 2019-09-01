from flask import render_template
from flask_login import login_required, current_user

from ... import models as md
from ... import db
from ...decorators import permission_required

from . import main


@main.route('/')
@login_required
def homepage():
    return render_template('base.html')


@main.route('/name/<new>')
@login_required
def change_name(new):
    p = md.User.query.get(1)
    print(p)
    p.name = new
    db.session.add(p)
    db.session.commit()
    return "name changed"