from flask import render_template, flash, redirect, url_for
from flask_login import login_user, logout_user, login_required, fresh_login_required

from ... import models as md
from .forms import LoginForm
from . import auth


@auth.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # check whether user exists in the database and whether
        # the password entered matches the password in the database
        user = md.User.query.filter_by(username=form.username.data).first()
        if user is not None and user.verify_password(form.password.data):
            # log user in
            login_user(user)

            # redirect to the home page after login
            return redirect(url_for('main.homepage'))

        # when login details are incorrect
        else:
            flash('Invalid username or password.', category='danger')

    # load login template
    return render_template('auth/login.html', form=form, title='Login')


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have successfully been logged out.')

    # redirect to the login page
    return redirect(url_for('auth.login'))


@auth.route('/user', methods=['GET', 'POST'])
@fresh_login_required
def user():
    """Update user data"""
    
    return render_template("base.html")
