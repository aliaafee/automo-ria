import json
import requests
import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint

from user import User

class Connection:
    user = None
    index_url = None
    index_data = {}


    def login(self, index_url, username, password):
        user = User()
        self.index_url = index_url
        if not user.login(index_url, username, password):
            return False

        self.user = user
        return True


    def is_loggedin(self):
        if self.user is None:
            print("Connection: No Login User")
            return False

        if not self.user.is_loggedin():
            print("Connection: Not Logged In")
            return False

        return True

    
    def get_index(self):
        if not self.index_data:
            self.index_data = self.get(self.index_url)
        return self.index_data


    def get(self, url, params=None):
        if not self.is_loggedin():
            return None

        auth_retry = 3
        while auth_retry > 0:
            try:
                r = requests.get(url, params=params, auth=self.user.get_auth_params())
            except requests.ConnectionError:
                print("Get: Connection Error")
                return False

            if r.status_code == 401:
                print("Get: Not Authorized")
                auth_retry -= 1
                if not self.user.get_token():
                    break
            else:
                break

        if r.status_code != 200:
            print("Get: Response Error {}".format(r.status_code))
            print(r.text)
            return None

        try:
            data = json.loads(r.text)
        except json.JSONDecodeError:
            print("Get: JSON decode error")
            print(data)
            return None
        
        return data


    def post_json(self, url, data, params=None):
        if not self.is_loggedin():
            return None

        auth_retry = 3
        while auth_retry > 0:
            try:
                #r = requests.get(url, params=params, auth=self.user.get_auth_params())
                r = requests.post(url, json=data, params=params, auth=self.user.get_auth_params())
            except requests.ConnectionError:
                print("Post: Connection Error")
                return False

            if r.status_code == 401:
                print("Post: Not Authorized")
                auth_retry -= 1
                if not self.user.get_token():
                    break
            else:
                break

        if r.status_code != 200:
            print("Post: Response Error {}".format(r.status_code))

        try:
            response_data = json.loads(r.text)
        except json.JSONDecodeError:
            print("Post: JSON decode error")
            print(r.text)
            return None
        
        return response_data