"""Automo WebAPP"""
from flask import Flask, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_bootstrap import Bootstrap

from config import config

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
bootstrap = Bootstrap()


def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)
    migrate.init_app(app, db)
    bootstrap.init_app(app)

    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = "You must be logged in to access this page."

    from .blueprints import main_blueprint 
    app.register_blueprint(main_blueprint)

    from .blueprints import auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .resources import api_bp
    app.register_blueprint(api_bp)

    return app
