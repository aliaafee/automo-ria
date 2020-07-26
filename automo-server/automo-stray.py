import os
import sys
import logging
from waitress import serve
from multiprocessing import Process
import pystray
import webbrowser
from PIL import Image, ImageDraw

from app import create_app, db
from config import Config

SERVER_HOST = "127.0.0.1"
SERVER_PORT = "8080"
SERVER_THREADS = 4


basedir = os.path.abspath(os.path.dirname(__file__))

class AppConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'patient-data.sqlite')

logging.basicConfig(filename='automo-stray.log',level=logging.INFO)
#logger = logging.getLogger('waitress')
#logger.setLevel(logging.INFO)


def runserver():
    app = create_app(AppConfig)

    serve(
        app,
        host=SERVER_HOST,
        port=SERVER_PORT,
        threads=SERVER_THREADS)

server_process = Process(target=runserver)


def on_menu_exit(icon):
    print("Stopping Server")
    server_process.terminate()
    exit()


def on_open_site(incon):
    webbrowser.open('http://{}:{}'.format(SERVER_HOST, SERVER_PORT), new=2)


def create_icon():
    icon = pystray.Icon('AutoMO')
    icon.icon = Image.open(os.path.join(basedir, 'app', 'static', 'images', 'icons-96.png'))
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
    print("Starting Server Process...")
    server_process.start()

    icon = create_icon()
    icon.run()
