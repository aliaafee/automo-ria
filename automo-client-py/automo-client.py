
import requests
import json
import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint
from random import randint, random

#For testing only
requests.packages.urllib3.disable_warnings(requests.urllib3.exceptions.SubjectAltNameWarning)


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
        
        if command[0] == 'gettest':
            self.last_command = command_str
            self.get_test()
            return True

        if command[0] == 'posttest':
            self.last_command = command_str
            self.post_test()
            return True


        print("Unknown Command")
        return True


    def get_test(self):
        test_cases = [
             '{}patients/'.format(self.index_url),
             '{}patients/1'.format(self.index_url),
             '{}patients/1/encounters/'.format(self.index_url),
             '{}patients/1/problems/'.format(self.index_url),
             '{}patients/1/phone-numbers/'.format(self.index_url),
             '{}addresses'.format(self.index_url),
             '{}wards/'.format(self.index_url),
             '{}beds/'.format(self.index_url),
             '{}wards/1/beds/'.format(self.index_url),
             '{}patients/1/admissions/'.format(self.index_url),
             '{}patients/1/admissions/?discharged=True'.format(self.index_url),
             '{}patients/1/admissions/1/encounters/'.format(self.index_url),
             '{}patients/1/admissions/1/discharge-summary.pdf'.format(self.index_url),
             '{}icd10/categories/'.format(self.index_url),
             '{}icd10/categories/A01'.format(self.index_url),
             '{}icd10/categories/?block=A00-A09&per_page=100'.format(self.index_url),
             '{}icd10/categories/?block=A00-A09&per_page=100&detailed=True'.format(self.index_url),
             '{}icd10/modifierclasses/'.format(self.index_url),
             '{}icd10/modifierclasses/?modifier_code=S05F10_4'.format(self.index_url),
             '{}patients/1/admissions/1/encounters/?type=vitalsigns'.format(self.index_url)
        ]

        failed = 0
        for url in test_cases:
            print("> get {}".format(url))
            try:
                data = self.conn.get(url)
            except:
                failed += 1
        print("Failed {}".format(failed))


    def post_test(self, data_str=""):
        test_cases = [
            (
                "{}patients/1".format(self.index_url),
                {
                    'name': 'Testy Name {}'.format(randint(1, 100))
                },
            ),
            (
                "{}patients/1".format(self.index_url),
                {
                    'allergies': 'Bad Medicine {}'.format(randint(1, 100))
                },
            ),
            (
                "{}patients/1/encounters/2".format(self.index_url),
                {
                    'pulse_rate': random() * 100
                },
            ),
            (
                "{}patients/1/problems/1".format(self.index_url),
                {
                    'start_time': datetime.datetime.now().isoformat()
                },
            ),
            (
                "{}patients/1/phone-numbers/1".format(self.index_url),
                {
                    'name': 'Father {}'.format(randint(1, 100)),
                    'number': '{}'.format(randint(10000000,999999999))
                }
            ),
            (
                '{}patients/1/current-address'.format(self.index_url),
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                }
            ),
            (
                '{}patients/1/permanent-address'.format(self.index_url),
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                }
            ),
            (
                '{}addresses/1'.format(self.index_url),
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                }
            ),
            (
                '{}patients/1'.format(self.index_url),
                {
                    'time_of_birth': datetime.datetime(1980, 10, 25, 12, 50, 20).isoformat(),
                    'time_of_death': datetime.datetime(2000, 10, 25, 12, 50, 20).isoformat()
                }
            )
            ,
            (
                '{}patients/1'.format(self.index_url),
                {
                    'time_of_birth': datetime.datetime.now().isoformat(),
                    'time_of_death': datetime.datetime.now().isoformat()
                }
            ),
            (
                '{}patients/1'.format(self.index_url),
                {
                    'time_of_birth': '{}-{}-{}T{}:{}:{}'.format(
                        randint(1900,2020),
                        randint(10,12),
                        randint(10,28),
                        randint(10,23),
                        randint(10,59),
                        randint(10,59)
                    ),
                    'time_of_death': '{}-{}-{}T{}:{}:{}'.format(
                        randint(1900,2020),
                        randint(10,12),
                        randint(10,28),
                        randint(10,23),
                        randint(10,59),
                        randint(10,59)
                    ),
                }
            ),
            (
                '{}wards/1'.format(self.index_url),
                {
                    'name': 'Rando Ward {}'.format(randint(10,99))
                }
            ),
            (
                '{}wards/1/beds/1'.format(self.index_url),
                {
                    'number': 'AB{}'.format(randint(1,100))
                }
            ),
            (
                '{}beds/2'.format(self.index_url),
                {
                    'number': 'XB{}'.format(randint(1,100))
                }
            ),
            (
                '{}patients/1/admissions/1'.format(self.index_url),
                {
                    'start_time': datetime.datetime.now().isoformat(),
                    'end_time': datetime.datetime.now().isoformat()
                }
            ),
        ]

        failed = 0
        for url, data in test_cases:
            print("> Begin Test")
            #print("Sending Data")
            print(url)
            #pprint(data)

            response_data = self.conn.post_json(url, data)
            
            #print("Response Data")
            #pprint(response_data)

            #print("Getting url")
            response_data = self.conn.get(url)
            #pprint(response_data)
            #print("")
            if response_data:
                for key, value in data.items():
                    match = False
                    if response_data[key] == value:
                        match = True
                    else:
                        failed += 1
                    print("[{}] -> {} = {} [{}]".format(key, value, response_data[key], match))
            else:
                failed += 1

            print(" ")
            print(" ")

        print("{} Tests Failed".format(failed))
            





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
