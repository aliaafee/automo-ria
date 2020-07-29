Basic Usage
-----------

1) Install Pip requirements.txt

2) python automo-cli.py db init

3) python automo-cli.py install -i icd10/icdClaML2016ens.xml
   Set a admin username and password when prompted.

4) python automo-cli.py fake
   To generate some fake data for testing if you want to.

5) python automo-cli.py runserver
   To run the server

   OR
   To run with gunicorn

   gunicorn -c gunicorn.conf.py automo-server:app



6) Generate ssl key
   openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

   Run with HTTPS
   gunicorn --certfile certificates/cert.pem --keyfile certificates/key.pem -c gunicorn.conf.py automo-server:app


Windows Installation Notes
--------------------------

1) pip install win-requirements.txt

2) Install weasy print as explained at https://weasyprint.readthedocs.io/en/stable/install.html

Important: Following packages need to be installed in this order, or it does not work. Testd on Python 3.8.5 64bit

3) pip install cffi

4) pip install cairocffi

5) pip install weasyprint

6) pip install flask_weasyprint

7) install GTK+

