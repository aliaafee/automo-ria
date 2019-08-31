import os
from flask_script import Manager, Shell
from flask_migrate import MigrateCommand

from automo import create_app, db
from automo import models
from automo import resources
from automo import utilities


app = create_app(os.getenv('FLASK_CONFIG') or 'default')
manager = Manager(app)

def make_shell_context():
    return dict(
        app=app,
        db=db,
        md=models,
        utilities=utilities
    )

manager.add_command("shell", Shell(make_context=make_shell_context))
manager.add_command("db", MigrateCommand)

if __name__ == '__main__':
    manager.run()