from flask import render_template
from flask_login import login_required, current_user

from . import main


@main.route('/')
@login_required
def homepage():
    return render_template('base.html')
