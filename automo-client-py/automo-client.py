
import requests
import json
import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint
from random import randint, random


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
        except requests.ConnectionError:
            print("Login: Connection Error")
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
        



class Connection:
    user = None
    index_url = None


    def login(self, index_url, username, password):
        user = User()
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
            print(r.text)
            return None

        try:
            data = json.loads(r.text)
        except json.JSONDecodeError:
            print("Post: JSON decode error")
            print(r.text)
            return None
        
        return data
        



class ClientApp:
    def __init__(self, index_url):
        self.index_url = index_url
        self.user = None
        self.conn = Connection()
        self.last_command = ""


    def process_command(self, command_str):
        command = command_str.split(" ")

        if command[0] == 'exit':
            return False

        if command[0] == 'help':
            print("Commands: help, exit, get_index, get <url>")
            return True

        if command[0] == 'get_index':
            self.last_command = command_str
            data = self.conn.get(self.index_url)
            pprint(data)
            return True

        if command[0] == 'get':
            self.last_command = command_str
            data = self.conn.get(command[1])
            pprint(data)
            return True

        if command[0] == 'posttest':
            self.last_command = command_str
            self.post_test()
            return True


        print("Unknown Command")
        return True


    def post_test(self, data_str=""):
        test_cases = [
            (
                "http://127.0.0.1:5000/api/patients/1",
                {
                    'name': 'Testy Name {}'.format(randint(1, 100))
                },
            ),
            (
                "http://127.0.0.1:5000/api/patients/1",
                {
                    'allergies': 'Bad Medicine {}'.format(randint(1, 100))
                },
            ),
            (
                "http://127.0.0.1:5000/api/patients/3/encounters/11",
                {
                    'pulse_rate': random() * 100
                },
            ),
            (
                "http://127.0.0.1:5000/api/phone-numbers/1",
                {
                    'name': 'Father {}'.format(randint(1, 100)),
                    'number': '{}'.format(randint(10000000,999999999))
                }
            ),
            (
                'http://127.0.0.1:5000/api/patients/1/current-address',
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                }
            ),
            (
                'http://127.0.0.1:5000/api/patients/1/permanent-address',
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                }
            ),
            (
                'http://127.0.0.1:5000/api/addresses/1',
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                }
            )
        ]

        for url, data in test_cases:
            print("### BEGIN TEST CASE ###")
            #print("Sending Data")
            print(url)
            #pprint(data)

            response_data = self.conn.post_json(url, data)
            
            #print("Response Data")
            #pprint(response_data)

            #print("Getting url")
            response_data = self.conn.get(url)
            #pprint(response_data)
            print("")
            for key, value in data.items():
                match = False
                if response_data[key] == value:
                    match = True
                print("[{}] -> {} = {} [{}]".format(key, value, data[key], match))
            print(" ")
            print(" ")
            





    def start(self):
        while True:
            while not self.conn.is_loggedin():
                self.conn.login(
                    self.index_url,
                    input("Username: "),
                    getpass("Password: ")
                )

            prompt = "{}@automo >> ".format(self.conn.user.username)
            command = input(prompt)

            if command == "":
                command = self.last_command
                print(command)
            
            result = self.process_command(command)

            if result == False:
                break
        print("Exiting")



def main():
    client_app = ClientApp('http://127.0.0.1:5000/api/')

    client_app.start()



if __name__ == '__main__':
    main()
