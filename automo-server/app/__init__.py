"""Automo WebAPP"""
from flask import Flask, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_bootstrap import Bootstrap

from config import config
from .json_encoder import CustomJSONEncoder
from .template_filters import register_filters

db = SQLAlchemy()
#login_manager = LoginManager()
migrate = Migrate()
#bootstrap = Bootstrap()


def create_app(config_object):
    app = Flask(__name__)

    app.json_encoder = CustomJSONEncoder

    register_filters(app)

    app.config.from_object(config_object)
    config_object.init_app(app)

    db.init_app(app)
    migrate.init_app(app, db)
    #bootstrap.init_app(app)

    #login_manager.init_app(app)
    #login_manager.login_view = 'auth.login'
    #login_manager.login_message = "You must be logged in to access this page."

    from .blueprints import main_blueprint 
    app.register_blueprint(main_blueprint)

    #from .blueprints import auth_blueprint
    #app.register_blueprint(auth_blueprint)

    #from .blueprints import admin_blueprint
    #app.register_blueprint(admin_blueprint)

    from .resources import api
    app.register_blueprint(api)

    return app
