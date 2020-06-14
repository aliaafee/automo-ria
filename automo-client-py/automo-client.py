
import requests
import json
import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint
from random import randint, random, choice
from faker import Faker

fake = Faker()

admission_fields = [
    'chief_complaints', 
    'history', 
    'past_history', 
    'general_inspection', 
    'exam_head', 
    'exam_neck', 
    'exam_chest', 
    'exam_abdomen', 
    'exam_genitalia', 
    'exam_pelvic_rectal',  
    'exam_extremities', 
    'exam_other',
    'hospital_course',
    'discharge_advice',
    'follow_up'
]

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
            data = json.loads(r.text)
        except json.JSONDecodeError:
            print("Post: JSON decode error")
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

        if command[0] == 'newtest':
            self.last_command = command_str
            self.new_test()
            return True

        if command[0] == 'admittest':
            self.last_command = command_str
            self.admittest()
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
             '{}patients/1/admissions/1/encounters/?type=vitalsigns'.format(self.index_url),
             '{}personnel/'.format(self.index_url),
             '{}personnel/?type=doctor'.format(self.index_url)
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
        iso_now = datetime.datetime.now().isoformat()
        test_cases = [
            (
                "{}patients/1".format(self.index_url),
                {
                    'name': 'Testy Name {}'.format(randint(1, 100))
                },
                {},
            ),
            (
                "{}patients/1".format(self.index_url),
                {
                    'allergies': 'Bad Medicine {}'.format(randint(1, 100))
                },
                {},
            ),
            (
                "{}patients/1/encounters/2".format(self.index_url),
                {
                    'pulse_rate': random() * 100
                },
                {},
            ),
            (
                "{}patients/1/problems/1".format(self.index_url),
                {
                    'start_time': datetime.datetime.now().isoformat()
                },
                {},
            ),
            (
                "{}patients/1/phone-numbers/1".format(self.index_url),
                {
                    'name': 'Father {}'.format(randint(1, 100)),
                    'number': '{}'.format(randint(10000000,999999999))
                },
                {},
            ),
            (
                '{}patients/1/current-address'.format(self.index_url),
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                },
                {},
            ),
            (
                '{}patients/1/permanent-address'.format(self.index_url),
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                },
                {},
            ),
            (
                '{}addresses/1'.format(self.index_url),
                {
                    'line_1': 'House Number {}'.format(randint(1, 100)),
                    'line_1': 'Banana Republic {}'.format(randint(1, 100))
                },
                {},
            ),
            (
                '{}patients/1'.format(self.index_url),
                {
                    'time_of_birth': datetime.datetime(1980, 10, 25, 12, 50, 20).isoformat(),
                    'time_of_death': datetime.datetime(2000, 10, 25, 12, 50, 20).isoformat()
                },
                {},
            )
            ,
            (
                '{}patients/1'.format(self.index_url),
                {
                    'time_of_birth': datetime.datetime.now().isoformat(),
                    'time_of_death': datetime.datetime.now().isoformat()
                },
                {},
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
                },
                {},
            ),
            (
                '{}wards/1'.format(self.index_url),
                {
                    'name': 'Rando Ward {}'.format(randint(10,99))
                },
                {},
            ),
            (
                '{}wards/1/beds/1'.format(self.index_url),
                {
                    'number': 'AB{}'.format(randint(1,100))
                },
                {},
            ),
            (
                '{}beds/2'.format(self.index_url),
                {
                    'number': 'XB{}'.format(randint(1,100))
                },
                {},
            ),
            (
                '{}patients/1/admissions/1'.format(self.index_url),
                {
                    'start_time': datetime.datetime.now().isoformat(),
                    'end_time': datetime.datetime.now().isoformat()
                },
                {},
            ),
            (
                "{}patients/1/encounters/2".format(self.index_url),
                {
                    'pulse_rate': 'String',
                    'diastolic_bp': random() * 100
                },
                {'error': 'unprocessable', 'invalid_fields': {'pulse_rate': 'Invalid float'}},
            ),
            (
                '{}patients/2'.format(self.index_url),
                {
                    'current_address': {
                        'city': 'City{}'.format(randint(1,100)),
                        'country': 'Maldives'
                    }
                },
                {}
            ),
            (
                '{}patients/1'.format(self.index_url),
                {
                    'phone_numbers': [
                    ]
                },
                {'error': 'unprocessable', 'invalid_fields': {'phone_numbers': 'Attribute is a list, cannot set'}}
            ),
            (
                '{}patients/2'.format(self.index_url),
                {
                    'current_address': None
                },
                {}
            ),
            (
                '{}patients/2'.format(self.index_url),
                {
                    'current_address': {
                        'city': 'City{}'.format(randint(1,100))
                    }
                },
                {'error': 'unprocessable', 'invalid_fields': {'current_address': {'country': 'Required'}}}
            ),
            (
                '{}patients/2'.format(self.index_url),
                {
                    'current_address': {
                        'city': 'City{}'.format(randint(1,100)),
                        'country': None
                    }
                }
                ,
                {'error': 'unprocessable', 'invalid_fields': {'current_address': {'country': 'Cannot be blank'}}}
            ),
            (
                '{}patients/2'.format(self.index_url),
                {
                    'current_address': {
                        'city': 'City{}'.format(randint(1,100)),
                        'country': 'Maldives'
                    }
                }
                ,
                {}
            ),
            (
                '{}patients/2'.format(self.index_url),
                {
                    'current_address': {
                        'city': 'City{}'.format(randint(1,100)),
                        'country': 'LongContr{}'.zfill(300)
                    }
                }
                ,
                {'error': 'unprocessable', 'invalid_fields': {'current_address': {'country': 'String is too long'}}}
            ),
            (
                '{}patients/1/admissions/1/problems/'.format(self.index_url),
                [
                    {   
                        'icd10class_code': choice(["A","B","C"]) + "0" + str(randint(1,9))
                    }
                ],
                {'error': 'unprocessable', 'invalid_fields': [{'start_time': 'Required'}]}
            ),
            (
                '{}patients/1/admissions/1/problems/'.format(self.index_url),
                [
                    {   
                        'start_time': datetime.datetime.now().isoformat()
                    }
                ],
                {'error': 'unprocessable', 'invalid_fields': [{'icd10class_code': 'Required'}]}
            ),
            (
                '{}patients/1/admissions/1/problems/'.format(self.index_url),
                [
                    {   
                        'icd10class_code': choice(["A","B","C"]) + "0" + str(randint(1,9)),
                        'start_time': iso_now
                    }
                ],
                {}
            ),
            (
                '{}patients/1/admissions/1/problems/'.format(self.index_url),
                [
                    {   
                        'id': 1
                    }
                ],
                {'error': 'unprocessable', 'message': 'Databse Error: This problem already exists in this encounter'}
            )
        ]

        failed = 0
        for url, data, expected_response in test_cases:
            print("> Begin Test")
            #print("Sending Data")
            print(url)
            #pprint(data)

            post_response_data = self.conn.post_json(url, data)

            print(post_response_data)

            if expected_response:
                if post_response_data == expected_response:
                    print("Got Expected Response")
                    response_data = self.conn.get(url)
                else:
                    failed += 1
                    print(post_response_data)
            elif isinstance(data, list):
                print("Got a list")
                for item, item_r in zip(data, post_response_data):
                    if 'icd10class_code' in item:
                        if item['icd10class_code'] != item_r['icd10class']['code']:
                            failed += 1
            else:
                response_data = self.conn.get(url)
                #pprint(response_data)
                #print("")
                print(isinstance(response_data, list))
                if isinstance(response_data, dict):
                    for key, value in data.items():
                        if type(value) is dict:
                            for sub_key, sub_value in value.items():
                                sub_match = False
                                if response_data[key] != None:
                                    if response_data[key][sub_key] == sub_value:
                                        sub_match = True
                                    else:
                                        failed += 1
                                    print("[{}.{}] -> {} = {} [{}]".format(key, sub_key, sub_value, response_data[key][sub_key], sub_match))
                                else:
                                    failed += 1
                        else:
                            match = False
                            if response_data[key] == value:
                                match = True
                            else:
                                print(post_response_data)
                                failed += 1
                            print("[{}] -> {} = {} [{}]".format(key, value, response_data[key], match))
                else:
                    print(response_data)
                    failed += 1

            print(" ")
            print(" ")

        print("{} Tests Failed".format(failed))
            


    def new_test(self):
        test_cases = [
            (
                "{}patients/".format(self.index_url),
                {
                    'name': 'Testy Name {}'.format(randint(1, 100)),
                    'hospital_no': '{}'.format(randint(100000, 999999)),
                    'national_id_no': 'A{}'.format(randint(100000, 999999)),
                    'sex': 'X',
                    'time_of_birth': datetime.datetime(
                        randint(1900,1999),
                        randint(1,12),
                        randint(1, 25)
                    ).isoformat()
                },
                None
            ),
            (
                "{}patients/".format(self.index_url),
                {
                    'id': 10,
                    'name': 'Testy Name {}'.format(randint(1, 100)),
                    'hospital_no': '{}'.format(randint(100000, 999999)),
                    'national_id_no': 'A{}'.format(randint(100000, 999999)),
                    'sex': 'X',
                    'time_of_birth': datetime.datetime(
                        randint(1900,1999),
                        randint(1,12),
                        randint(1, 25)
                    ).isoformat()
                },
                {
                    "error": "unprocessable", 
                    "invalid_fields": {
                        "id": "Field cannot be set"
                        }
                }
            ),
            (
                "{}patients/".format(self.index_url),
                {
                    'name': 'Testy Name {}'.format(randint(1, 100))
                },
                {
                    'error': 'unprocessable', 'invalid_fields': {'hospital_no': 'Required', 'national_id_no': 'Required', 'sex': 'Required', 'time_of_birth': 'Required'}
                }
            ),
            (
                "{}patients/3/admissions/".format(self.index_url),
                {
                    'personnel_id': 'X',
                    'bed_id': 3
                },
                {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied', 'personnel_id': 'Doctor not found'}}
            ),
            (
                "{}patients/3/admissions/".format(self.index_url),
                {
                    'personnel_id': 1,
                    'bed_id': 'X'
                },
                {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed not found'}}
            ),
            (
                "{}patients/3/admissions/".format(self.index_url),
                {
                    'personnel_id': 1,
                    'bed_id': 3
                },
                {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied'}}
            ),
            (
                "{}patients/3/admissions/".format(self.index_url),
                {
                    'personnel_id': 1,
                    'bed_id': 3,
                    'start_time': 'lol'
                },
                {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied'}}
            ),
            (
                "{}patients/3/admissions/".format(self.index_url),
                {
                    'personnel_id': 1,
                    'bed_id': 3,
                    'start_time': 'lol'
                },
                {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied'}}
            ),
            (
                "{}patients/3/admissions/1/encounters/".format(self.index_url),
                {
                    
                },
                {'error': 'resource not found', 'message': 'Admission not found'}
            ),
            (
                "{}patients/1/admissions/1/encounters/".format(self.index_url),
                [],
                {'error': 'unprocessable', 'message': 'Unexpected data format'}
            ),
            (
                "{}patients/1/admissions/1/encounters/".format(self.index_url),
                {
                    
                },
                {'error': 'unprocessable', 'invalid_fields': {'type': 'Encounter type not set'}}
            )
            ,
            (
                "{}patients/1/admissions/1/encounters/".format(self.index_url),
                {
                    'type': 'vitalsigns'
                },
                {'error': 'unprocessable', 'invalid_fields': {'start_time': 'Required'}}
            )
            ,
            (
                "{}patients/1/admissions/1/encounters/".format(self.index_url),
                {
                    'type': 'vitalsigns',
                    'start_time': datetime.datetime.now().isoformat(),
                    'pulse_rate': randint(60,120)
                },
                {}
            )
        ]

        failed = 0
        for url, data, expected_response in test_cases:
            print("post {}".format(url))
            response_data = self.conn.post_json(url, data)
            if expected_response:
                if expected_response == response_data:
                    print("Got Expected Response")
                else:
                    failed += 1
                    print("Expected {} ".format(expected_response))
                    print("Got      {} ".format(response_data))
            else:
                try:
                    print("get {}".format(response_data['url']))
                    response_data = self.conn.get(response_data['url'])
                except KeyError:
                    response_data = None
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
            print("")

        print("{} Tests Failed".format(failed))


    def register_and_admit_random_patient(self):
        problems_count = 5
        encounters_count = 5

        def fake_address():
            add = {}
            add_str = fake.address().split('\n')
            add['line_1'] = add_str[0]
            add['city'] = add_str[1].split(",")[0]
            try:
                add['region'] = add_str[1].split(",")[1]
            except:
                pass
            add['country'] = fake.country()
            return add

        def random_encounter():
            types = ['vitalsigns', 'measurements']
            result = {
                'type': choice(types),
                'start_time': datetime.datetime.now().isoformat()
            }
            if result['type'] == 'vitalsigns':
                result['pulse_rate'] = randint(60, 100)
                result['diastolic_bp'] = randint(50, 60)
                result['systolic_bp'] =  result['diastolic_bp'] + randint(0, 60)
            elif result['type'] == 'measurements':
                result['weight'] = randint(30, 100)
                result['height'] = 1 + (random() * 0.9)
            
            return result


        index = self.conn.get(self.index_url)

        wards = self.conn.get(index['wards'])['items']
        ward = self.conn.get(choice(wards)['url'])

        beds = self.conn.get(ward['beds'])['items']
        bed = self.conn.get(choice(beds)['url'])

        doctors = self.conn.get(index['personnel']['doctors'])['items']
        doctor = self.conn.get(choice(doctors)['url'])

        #Register a patient
        patient_post_result = self.conn.post_json(
            index['patients'],
            {
                'name': fake.name(),
                'hospital_no': '{}'.format(randint(100000, 999999)),
                'national_id_no': 'A{}'.format(randint(100000, 999999)),
                'sex': choice(['M','F']),
                'time_of_birth': datetime.datetime(
                    randint(1900,1999),
                    randint(1,12),
                    randint(1, 25)
                ).isoformat(),
                'current_address': fake_address(),
                'permanent_address': fake_address(),
                'phone_no': fake.phone_number()
            }
        )
        error = patient_post_result.pop('error', None)
        if error:
            print("Could Not Register")
            print(admission_post_result)
            return

        patient = self.conn.get(patient_post_result['url'])

        print("Registered {} {} {}".format(
            patient['national_id_no'],
            patient['name'],
            patient['url'])
        )

        #Admit the patient
        data = {
            'bed_id': bed['id'],
            'personnel_id': doctor['id']
        }
        for field in admission_fields:
            data[field] = fake.paragraph()
        admission_post_result = self.conn.post_json(
            patient['admissions'],
            data
        )
        error = admission_post_result.pop('error', None)
        if error:
            print("Could Not Admit")
            print(admission_post_result)
            return

        admission = self.conn.get(admission_post_result['url'])
        print("Admitted {}".format(admission['url']))

        #Add Problems to Admission
        problems_list = []
        for i in range(randint(1, problems_count)):
            problems_list.append({
                'start_time': datetime.datetime.now().isoformat(),
                'icd10class_code': choice(["A","B","C"]) + "0" + str(randint(1,9))
            })
        problem_post_result = self.conn.post_json(
            admission['problems_url'],
            problems_list
        )
        if isinstance(problem_post_result, dict):
            error = problem_post_result.pop('error', None)
            if error:
                print("Could not add problems to admission")
                print(problem_post_result)

        #Add Subencounters
        for i in range(randint(1, encounters_count)):
            encounter_post_result = self.conn.post_json(
                admission['encounters']['all_encounters'],
                random_encounter()
            )
            error = encounter_post_result.pop('error', None)
            if error:
                print("Could not add child encounter")
                print(encounter_post_result)

        #TODO Add Prescription

        #Discharge the patient
        discharge_result = self.conn.post_json(
            admission['discharge'],
            {}
        )
        error = discharge_result.pop('error', None)
        if error:
            print("Could not discharge")
            print(discharge_result)
        print("Discharged")
        print("")




    def admittest(self):
        for i in range(2):
            self.register_and_admit_random_patient()
        
        """
        ward_index = 1
        bed_index = 2
        doctor_index = 1
        patient_index = 2
        index = self.conn.get(self.index_url)

        wards = self.conn.get(index['wards'])['items']
        ward = self.conn.get(wards[ward_index]['url'])
        beds = self.conn.get(ward['beds'])['items']
        bed = beds[bed_index]
        print(bed)

        doctors = self.conn.get(index['personnel']['doctors'])['items']
        #print(doctors)
        doctor = self.conn.get(doctors[doctor_index]['url'])
        print(doctor)
        
        patients = self.conn.get(index['patients'])['items']
        patient = self.conn.get(patients[patient_index]['url'])
        active_admissions = self.conn.get(patient['admissions_active'])

        print("")

        if active_admissions is not None:
            print("Already Admitted")
            active_admission = self.conn.get(active_admissions['items'][0]['url'])
            print("Discharging")
            result = self.conn.post_json(
                active_admission['discharge'],
                {}
            )
            print(result)

        print("Admitting Patient")
        result = self.conn.post_json(
            patient['admissions'],
            {
                'bed_id': bed['id'],
                'personnel_id': doctor['id']
            }
        )
        print(result)
        invalid_fields = result.pop('invalid_fields', None)
        if invalid_fields is not None:
            print("Could not admit {}".format(invalid_fields))
            return

        patient = self.conn.get(patients[patient_index]['url'])
        active_admissions = self.conn.get(patient['admissions_active'])
        active_admission = self.conn.get(active_admissions['items'][0]['url'])
        print("Discharging")
        result = self.conn.post_json(
            active_admission['discharge'],
            {}
        )
        print(result)

        data = {
            'bed_id': bed['id'],
            'personnel_id': doctor['id']
        }
        for field in admission_fields:
            data[field] = fake.paragraph()

        print("Admitting Patient")
        result = self.conn.post_json(
            patient['admissions'],
            data
        )
        print(result)

        patient = self.conn.get(patients[patient_index]['url'])
        active_admissions = self.conn.get(patient['admissions_active'])
        active_admission = self.conn.get(active_admissions['items'][0]['url'])
        print("Discharging")
        result = self.conn.post_json(
            active_admission['discharge'],
            {}
        )
        print(result)

        problems = self.conn.get(active_admission['problems_url'])

        result = self.conn.post_json(
            active_admission['problems_url'],
            [
                {   
                    'icd10_class_code': choice(["A","B","C"]) + "0" + str(randint(1,9))
                }
            ]
        )
        print(result)
        """



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
