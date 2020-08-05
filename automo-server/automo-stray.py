import os.path
import sys
import logging
from waitress import serve
from multiprocessing import Process, freeze_support
import pystray
import webbrowser
from PIL import Image, ImageDraw

from app import create_app, db
from app.install_db import install_db
from config import Config

basedir = os.path.abspath(os.path.dirname(__file__))

SERVER_HOST = "127.0.0.1"
SERVER_PORT = "8080"
SERVER_THREADS = 4
DATABASE_PATH = os.path.join(basedir, 'patient-data.sqlite')


class AppConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + DATABASE_PATH

logging.basicConfig(filename='automo-stray.log',level=logging.INFO)
#logger = logging.getLogger('waitress')
#logger.setLevel(logging.INFO)

app = create_app(AppConfig)


def runserver():
    print("Starting Server Process...")
    
    webbrowser.open('http://{}:{}'.format(SERVER_HOST, SERVER_PORT), new=2)

    serve(
        app,
        host=SERVER_HOST,
        port=SERVER_PORT,
        threads=SERVER_THREADS)

server_process = Process(target=runserver)


def on_menu_exit(icon):
    print("Stopping Server")
    server_process.terminate()
    icon.stop()
    exit()


def on_open_site(incon):
    webbrowser.open('http://{}:{}'.format(SERVER_HOST, SERVER_PORT), new=2)


def create_icon():
    icon = pystray.Icon('AutoMO')
    icon.icon = Image.open(os.path.join(basedir, 'app', 'static', 'images', 'icon.ico'))
    icon.menu = pystray.Menu(
        pystray.MenuItem(
            'Open {}:{}'.format(SERVER_HOST, SERVER_PORT),
            on_open_site,
            default=True
        ),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem(
            'Exit',
            on_menu_exit
        )
    )

    return icon




if __name__ == '__main__':
    print("Starting App")
    
    # This is needed to make multiprocessing work on windows
    freeze_support()

    if not os.path.isfile(DATABASE_PATH):
        print("Database does not exit")
        with app.app_context():
            install_db('admin', 'a', os.path.join(basedir, 'icd10', 'icdClaML2016ens.xml'))

    server_process.start()

    icon = create_icon()
    icon.run()
