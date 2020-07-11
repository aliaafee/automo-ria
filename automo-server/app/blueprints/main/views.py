from flask import render_template, send_file
from flask_login import login_required, current_user

from ... import models as md
from ... import db
#from ...decorators import permission_required

from . import main


@main.route('/')
def homepage():
    return render_template('index.html')


@main.route('/manifest.webmanifest')
def webapp_manifest():
    return send_file('static/manifest.webmanifest')