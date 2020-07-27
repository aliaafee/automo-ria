import os

from flask_script import Manager, Shell
from flask_migrate import MigrateCommand

from app import create_app, db
from app import models
from app import resources
from app import utilities
from config import config

app = create_app(
    config[os.getenv('FLASK_CONFIG') or 'default']
)

manager = Manager(app)

def make_shell_context():
    return dict(
        app=app,
        db=db,
        md=models,
        util=utilities,
        exit=exit
    )

manager.add_command("shell", Shell(make_context=make_shell_context))
manager.add_command("db", MigrateCommand)
manager.add_command("install", utilities.InstallCommand)
manager.add_command("fake", utilities.FakeData)
manager.add_command("serve", utilities.Serve)

if __name__ == '__main__':
    manager.run()
