import requests
import json
import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint

class User:
    username = None
    password = None
    token = None
    token_expire_time = None
    url = None
    token_url = None


    def login(self, index_url, username, password):
        self.username = username
        self.password = password

        try:
            r = requests.get(index_url, auth=(self.username, self.password))
        except requests.ConnectionError as e:
            print("Login: Connection Error {}".format(e))
            return False

        if r.status_code == 401:
            print("Login: Not Authorized")
            return False

        if r.status_code != 200:
            print("Login: Authorization Error")
            return False

        try:
            data = json.loads(r.text)
            self.token_url = data['auth_token']
        except json.JSONDecodeError:
            print("Login: Unexpected Response")
            return False
        except KeyError:
            print("Login: Unexpected Response")
            return False

        return True


    def get_token(self):
        try:
            r = requests.get(self.token_url, auth=(self.username, self.password))
        except requests.ConnectionError:
            print("Token: Connection Error")
            return False

        if r.status_code != 200:
            print("Token: Failed to get")
            return False

        try:
            data = json.loads(r.text)
            self.token = data['token']
            self.token_expire_time = datetime.datetime.now() + dateutil.relativedelta.relativedelta(seconds=int(data['expiration']))
        except json.JSONDecodeError:
            print("Token: Unexpected Response: Decode Error")
            print(r.text)
            return False
        except KeyError:
            print("Token: Unexpected Response: Key Error")
            print(r.text)
            return False
        
        print("Got New Token, expire at {}".format(self.token_expire_time))
        return True


    def get_auth_params(self):
        if self.token is None:
            return (self.username, self.password)
        return (self.token, "")


    def is_loggedin(self):
        if self.token_expire_time is None:
            print("Token: Absent")
            if not self.get_token():
                return False

        if datetime.datetime.now() > self.token_expire_time:
            print("Token: Expired")
            if not self.get_token():
                return False
        
        return True