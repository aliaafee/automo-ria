import requests
import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint
from random import randint, random, choice
from faker import Faker

def process_command(command_list, conn):
    try:
        command = command_list.pop(0)
    except IndexError:
        command = None
    
    if command == 'get':
        get_test(conn)
        return True

    if command == 'post':
        post_test(conn)
        return True

    if command == 'post2':
        post_test2(conn)
        return True

    if command == 'new':
        new_test(conn)
        return True

    if command == 'new2':
        new_test2(conn)
        return True

    if command == 'admit':
        register_and_admit_random_patient(conn)
        return True

    if command == 'admit_only':
        register_and_admit_random_patient(conn, True)
        return True

    if command == 'admit1':
        register_and_admit_random_patient_single_request(conn)
        return True
    
    if command == 'register':
        register_random_patient(conn)
        return True

    print(
        "WARNING: Never run tests on production server, it will\n"
        "         corrut data\n"
        "test supported commands:\n"
        "   get - run get tests\n"
        "   post - run post tests\n"
        "   new - run new test\n"
        "   admit - register and admit one patient and discharge\n"
        "   admit_only - register and admit one patien, dont discharge\n"
        "   admit1 - register and admit a patient with only a signle request\n"
        "   register - register one patient, dont admit\n"
    )
    return False

    

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

drugs = [
    'T. PANTOPRAZOLE 40mg',
    'T. PARACETAMOL 500mg',
    'T. CEFIXIME 200mg',
    'T. PERINORM 10mg',
    'T. IBUPROFEN 400mg',
    'T. DICLOFENAC 75mg'
]

orders = [
    'PO BD x 10 days',
    'PO TDS x 11 days',
    'PO BD x 25 days',
    'PO QID x 10 days'
]


def post_test2(conn):
    test_cases = [
        (
            'hospitals/1',
            {
                'name': 'SMALL CLINIC'
            },
            {

            }
        )
    ]

    for url, data, result in test_cases:
        post_response_data = conn.post_json('{}{}'.format(conn.index_url, url), data)

        print(post_response_data)


def new_test2(conn):
    test_cases = [
        (
            'hospitals/',
            {
                'name': 'IGMH'
            },
            {

            }
        ),
        (
            'hospitals/1/wards/',
            {
                'name': 'Private Uber Ward'
            },
            {

            }
        ),
        (
            'hospitals/1/wards/1/beds/',
            {
                'number': 'Yo'
            },
            {

            }
        )
    ]

    for url, data, result in test_cases:
        post_response_data = conn.post_json('{}{}'.format(conn.index_url, url), data)

        print(post_response_data)


def get_test(conn):
    test_cases = [
        '{}patients/'.format(conn.index_url),
        '{}patients/1'.format(conn.index_url),
        '{}patients/1/encounters/'.format(conn.index_url),
        '{}patients/1/problems/'.format(conn.index_url),
        '{}patients/1/phone-numbers/'.format(conn.index_url),
        '{}addresses'.format(conn.index_url),
        '{}wards/'.format(conn.index_url),
        '{}beds/'.format(conn.index_url),
        '{}wards/1/beds/'.format(conn.index_url),
        '{}patients/1/admissions/'.format(conn.index_url),
        '{}patients/1/admissions/?discharged=True'.format(conn.index_url),
        '{}patients/1/admissions/1/encounters/'.format(conn.index_url),
        '{}patients/1/admissions/1/discharge-summary.pdf'.format(conn.index_url),
        '{}icd10/categories/'.format(conn.index_url),
        '{}icd10/categories/A01'.format(conn.index_url),
        '{}icd10/categories/?block=A00-A09&per_page=100'.format(conn.index_url),
        '{}icd10/categories/?block=A00-A09&per_page=100&detailed=True'.format(conn.index_url),
        '{}icd10/modifierclasses/'.format(conn.index_url),
        '{}icd10/modifierclasses/?modifier_code=S05F10_4'.format(conn.index_url),
        '{}patients/1/admissions/1/encounters/?type=vitalsigns'.format(conn.index_url),
        '{}personnel/'.format(conn.index_url),
        '{}personnel/?type=doctor'.format(conn.index_url)
    ]

    failed = 0
    for url in test_cases:
        print("> get {}".format(url))
        try:
            data = conn.get(url)
        except:
            failed += 1
    print("Failed {}".format(failed))



def post_test(conn, data_str=""):
    iso_now = datetime.datetime.now().isoformat()
    test_cases = [
        (
            "{}patients/1".format(conn.index_url),
            {
                'name': 'Testy Name {}'.format(randint(1, 100))
            },
            {},
        ),
        (
            "{}patients/1".format(conn.index_url),
            {
                'allergies': 'Bad Medicine {}'.format(randint(1, 100))
            },
            {},
        ),
        (
            "{}patients/1/encounters/2".format(conn.index_url),
            {
                'pulse_rate': random() * 100
            },
            {},
        ),
        (
            "{}patients/1/problems/1".format(conn.index_url),
            {
                'start_time': datetime.datetime.now().isoformat()
            },
            {},
        ),
        (
            "{}patients/1/phone-numbers/1".format(conn.index_url),
            {
                'name': 'Father {}'.format(randint(1, 100)),
                'number': '{}'.format(randint(10000000,999999999))
            },
            {},
        ),
        (
            '{}patients/1/current-address'.format(conn.index_url),
            {
                'line_1': 'House Number {}'.format(randint(1, 100)),
                'line_1': 'Banana Republic {}'.format(randint(1, 100))
            },
            {},
        ),
        (
            '{}patients/1/permanent-address'.format(conn.index_url),
            {
                'line_1': 'House Number {}'.format(randint(1, 100)),
                'line_1': 'Banana Republic {}'.format(randint(1, 100))
            },
            {},
        ),
        (
            '{}addresses/1'.format(conn.index_url),
            {
                'line_1': 'House Number {}'.format(randint(1, 100)),
                'line_1': 'Banana Republic {}'.format(randint(1, 100))
            },
            {},
        ),
        (
            '{}patients/1'.format(conn.index_url),
            {
                'time_of_birth': datetime.datetime(1980, 10, 25, 12, 50, 20).isoformat(),
                'time_of_death': datetime.datetime(2000, 10, 25, 12, 50, 20).isoformat()
            },
            {},
        )
        ,
        (
            '{}patients/1'.format(conn.index_url),
            {
                'time_of_birth': datetime.datetime.now().isoformat(),
                'time_of_death': datetime.datetime.now().isoformat()
            },
            {},
        ),
        (
            '{}patients/1'.format(conn.index_url),
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
            '{}wards/1'.format(conn.index_url),
            {
                'name': 'Rando Ward {}'.format(randint(10,99))
            },
            {},
        ),
        (
            '{}wards/1/beds/1'.format(conn.index_url),
            {
                'number': 'AB{}'.format(randint(1,100))
            },
            {},
        ),
        (
            '{}beds/2'.format(conn.index_url),
            {
                'number': 'XB{}'.format(randint(1,100))
            },
            {},
        ),
        (
            '{}patients/1/admissions/1'.format(conn.index_url),
            {
                'start_time': datetime.datetime.now().isoformat(),
                'end_time': datetime.datetime.now().isoformat()
            },
            {},
        ),
        (
            "{}patients/1/encounters/2".format(conn.index_url),
            {
                'pulse_rate': 'String',
                'diastolic_bp': random() * 100
            },
            {'error': 'unprocessable', 'invalid_fields': {'pulse_rate': 'Invalid float'}},
        ),
        (
            '{}patients/2'.format(conn.index_url),
            {
                'current_address': {
                    'city': 'City{}'.format(randint(1,100)),
                    'country': 'Maldives'
                }
            },
            {}
        ),
        (
            '{}patients/1'.format(conn.index_url),
            {
                'phone_numbers': [
                ]
            },
            {'error': 'unprocessable', 'invalid_fields': {'phone_numbers': 'Attribute is a list, cannot set'}}
        ),
        (
            '{}patients/2'.format(conn.index_url),
            {
                'current_address': None
            },
            {}
        ),
        (
            '{}patients/2'.format(conn.index_url),
            {
                'current_address': {
                    'city': 'City{}'.format(randint(1,100))
                }
            },
            {'error': 'unprocessable', 'invalid_fields': {'current_address': {'country': 'Required'}}}
        ),
        (
            '{}patients/2'.format(conn.index_url),
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
            '{}patients/2'.format(conn.index_url),
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
            '{}patients/2'.format(conn.index_url),
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
            '{}patients/1/admissions/1/problems/'.format(conn.index_url),
            [
                {   
                    'icd10class_code': choice(["A","B","C"]) + "0" + str(randint(1,9))
                }
            ],
            {'error': 'unprocessable', 'invalid_fields': [{'start_time': 'Required'}]}
        ),
        (
            '{}patients/1/admissions/1/problems/'.format(conn.index_url),
            [
                {   
                    'start_time': datetime.datetime.now().isoformat()
                }
            ],
            {'error': 'unprocessable', 'invalid_fields': [{'icd10class_code': 'Required'}]}
        ),
        (
            '{}patients/1/admissions/1/problems/'.format(conn.index_url),
            [
                {   
                    'icd10class_code': choice(["A","B","C"]) + "0" + str(randint(1,9)),
                    'start_time': iso_now
                }
            ],
            {}
        ),
        (
            '{}patients/1/admissions/1/problems/'.format(conn.index_url),
            [
                {   
                    'id': 1
                }
            ],
            {'error': 'unprocessable', 'message': 'Databse Error: This problem already exists in this encounter'}
        ),
        (
            '{}patients/1/admissions/1'.format(conn.index_url),
            {
                'prescription': [
                    {
                        'drug': { 
                            'id': 1
                        },
                        'drug_order': 'PO TDS x 10 days',
                        'active': True
                    }
                ]
            },
            {}
        )
    ]

    failed = 0
    for url, data, expected_response in test_cases:
        print("> Begin Test")
        #print("Sending Data")
        print(url)
        #pprint(data)

        post_response_data = conn.post_json(url, data)

        print(post_response_data)

        if expected_response:
            if post_response_data == expected_response:
                print("Got Expected Response")
                response_data = conn.get(url)
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
            response_data = conn.get(url)
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



def new_test(conn):
    test_cases = [
        (
            "{}patients/".format(conn.index_url),
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
            "{}patients/".format(conn.index_url),
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
            "{}patients/".format(conn.index_url),
            {
                'name': 'Testy Name {}'.format(randint(1, 100))
            },
            {
                'error': 'unprocessable', 'invalid_fields': {'hospital_no': 'Required', 'national_id_no': 'Required', 'sex': 'Required', 'time_of_birth': 'Required'}
            }
        ),
        (
            "{}patients/3/admissions/".format(conn.index_url),
            {
                'personnel_id': 'X',
                'bed_id': 3
            },
            {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied', 'personnel_id': 'Doctor not found'}}
        ),
        (
            "{}patients/3/admissions/".format(conn.index_url),
            {
                'personnel_id': 1,
                'bed_id': 'X'
            },
            {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed not found'}}
        ),
        (
            "{}patients/3/admissions/".format(conn.index_url),
            {
                'personnel_id': 1,
                'bed_id': 3
            },
            {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied'}}
        ),
        (
            "{}patients/3/admissions/".format(conn.index_url),
            {
                'personnel_id': 1,
                'bed_id': 3,
                'start_time': 'lol'
            },
            {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied'}}
        ),
        (
            "{}patients/3/admissions/".format(conn.index_url),
            {
                'personnel_id': 1,
                'bed_id': 3,
                'start_time': 'lol'
            },
            {'error': 'unprocessable', 'invalid_fields': {'bed_id': 'Bed w0 - 2 is already occupied'}}
        ),
        (
            "{}patients/3/admissions/1/encounters/".format(conn.index_url),
            {
                
            },
            {'error': 'resource not found', 'message': 'Admission not found'}
        ),
        (
            "{}patients/1/admissions/1/encounters/".format(conn.index_url),
            [],
            {'error': 'unprocessable', 'message': 'Unexpected data format'}
        ),
        (
            "{}patients/1/admissions/1/encounters/".format(conn.index_url),
            {
                
            },
            {'error': 'unprocessable', 'invalid_fields': {'type': 'Encounter type not set'}}
        )
        ,
        (
            "{}patients/1/admissions/1/encounters/".format(conn.index_url),
            {
                'type': 'vitalsigns'
            },
            {'error': 'unprocessable', 'invalid_fields': {'start_time': 'Required'}}
        )
        ,
        (
            "{}patients/1/admissions/1/encounters/".format(conn.index_url),
            {
                'type': 'vitalsigns',
                'start_time': datetime.datetime.now().isoformat(),
                'pulse_rate': randint(60,120)
            },
            {}
        )
        ,
        (
            "{}patients/1/admissions/1/prescription/".format(conn.index_url),
            {
                
            },
            {'error': 'unprocessable', 'message': 'Expected a list of medication orders'}
        )
        ,
        (
            "{}patients/1/admissions/1/prescription/".format(conn.index_url),
            [

            ],
            {'error': 'unprocessable', 'message': 'Expected a list of medication orders'}
        )
        ,
        (
            "{}patients/1/admissions/1/prescription/".format(conn.index_url),
            [
                {
                    'drug_order': 'OD x 10 days'
                }
            ],
            {'error': 'unprocessable', 'invalid_fields': [{'drug_id': 'Both drug_id and drug_str cannot be empty/invalid', 'drug_str': 'Both drug_id and drug_str cannot be empty/invalid'}]}
        )
        ,
        (
            "{}patients/1/admissions/1/prescription/".format(conn.index_url),
            [
                {
                    'drug_id': 999999,
                    'drug_order': 'OD x 10 days'
                }
            ],
            {'error': 'unprocessable', 'invalid_fields': [{'drug_id': 'Both drug_id and drug_str cannot be empty/invalid', 'drug_str': 'Both drug_id and drug_str cannot be empty/invalid'}]}
        )
        ,
        (
            "{}patients/1/admissions/1/prescription/".format(conn.index_url),
            [
                {
                    'drug_str': 'T PANTOPRAZOLE 40mg'
                }
            ],
            {'error': 'unprocessable', 'invalid_fields': [{'drug_order': 'Required'}]}
        )
    ]

    failed = 0
    for url, data, expected_response in test_cases:
        print("post {}".format(url))
        response_data = conn.post_json(url, data)
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
                response_data = conn.get(response_data['url'])
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




def register_and_admit_random_patient_single_request(conn):
    problems_count = 5
    admissions_count = 5
    encounters_count = 5
    precription_count = 5

    index = conn.get(conn.index_url)

    wards = conn.get(index['wards'])['items']
    ward = conn.get(choice(wards)['url'])

    beds = conn.get(ward['beds'])['items']
    bed = conn.get(choice(beds)['url'])

    doctors = conn.get(index['personnel']['doctors'])['items']
    doctor = conn.get(choice(doctors)['url'])

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

    def random_encounter(i=None):
        types = [
            'measurements',
            'vitalsigns',
            'vitalsignsextended',
            'surgicalprocedure',
            'imaging',
            'endoscopy',
            'histopathology',
            'otherreport',
            'completebloodcount',
            'renalfunctiontest',
            'liverfunctiontest',
            'othertest'
        ]
        result = {
            'type': types[i] if i else choice(types),
            'start_time': datetime.datetime.now().isoformat(),
            'end_time': datetime.datetime.now().isoformat(),
            'personnel_id': doctor['id']
        }
        if result['type'] == 'measurements':
            result['weight'] = float(randint(30, 100)) + 0.5
            result['height'] = 1.0 + (random() * 0.9)
        elif result['type'] == 'vitalsigns':
            result['pulse_rate'] = randint(60, 100)
            result['respiratory_rate'] = randint(12, 24)
            result['diastolic_bp'] = randint(50, 60)
            result['systolic_bp'] =  result['diastolic_bp'] + randint(0, 60)
            result['temperature'] = float(randint(36,39)) + random()
        elif result['type'] == 'vitalsignsextended':
            result['pulse_rate'] = randint(60, 100)
            result['respiratory_rate'] = randint(12, 24)
            result['diastolic_bp'] = randint(50, 60)
            result['systolic_bp'] =  result['diastolic_bp'] + randint(0, 60)
            result['temperature'] = float(randint(36,39)) + random()
            result['cvp'] = float(randint(5, 20))
            result['diastolic_ibp'] = randint(50, 60)
            result['systolic_ibp'] = result['diastolic_ibp'] + randint(0, 60)
        elif result['type'] == 'surgicalprocedure':
            result['assistant'] = "Dr. {}".format(fake.name())
            result['anesthetist'] = "Dr. {}".format(fake.name())
            result['nurse'] = "S/N. {}".format(fake.name())
            result['emergency'] = choice([True, False])
            result['preoperative_diagnosis'] = fake.paragraph()
            result['postoperative_diagnosis'] = fake.paragraph()
            result['procedure_name'] = fake.paragraph()
            result['findings'] = fake.paragraph()
            result['steps'] = fake.paragraph()
        elif result['type'] == 'imaging':
            result['site'] = fake.paragraph()
            result['imaging_type'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['radiologist'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'endoscopy':
            result['site'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['endoscopist'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'endoscopy':
            result['site'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['pathologist'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'otherreport':
            result['name'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['reported_by'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'completebloodcount':
            result['hemoglobin'] = random() * 100
            result['tlc'] = random() * 100
            result['plt'] = random() * 100
            result['dlc_n'] = random() * 100
            result['dlc_l'] = random() * 100
            result['dlc_m'] = random() * 100
            result['dlc_e'] = random() * 100
        elif result['type'] == 'renalfunctiontest':
            result['urea'] = random() * 100
            result['creatinine'] = random() * 100
        elif result['type'] == 'liverfunctiontest':
            result['t_bil'] = random() * 100
            result['d_bil'] = random() * 100
            result['alt'] = random() * 100
            result['ast'] = random() * 100
            result['alp'] = random() * 100
        elif result['type'] == 'othertest':
            result['name'] = choice(['Spam', 'Cheez', 'Donuts', 'Calrity'])
            result['value'] = str(random() * 100)
            result['unit'] = choice(['cm/L', 'eggs/banana', 'tomatoes/m^3'])

        return result

    def make_admission(patient, bed, doctor):
        data = {
            'discharged_bed': bed,
            'personnel': doctor,
            'patient': patient,
            'start_time': datetime.datetime.now().isoformat(),
            'end_time': datetime.datetime.now().isoformat(),
        }
        for field in admission_fields:
            data[field] = fake.paragraph()

        #Add Problems to Admission
        data['problems'] = []
        for i in range(randint(1, problems_count)):
            data['problems'].append({
                'start_time': datetime.datetime.now().isoformat(),
                'icd10class': {
                    'code': choice(["A","B","C"]) + "0" + str(randint(1,9))
                },
                'comment': fake.paragraph()
            })

        #Add Subencounters
        data['encounters'] = []
        for i in range(randint(1, encounters_count)):
            data['encounters'].append(random_encounter())

        #Add Prescription
        data['prescription'] = []
        for i in range(randint(1, precription_count)):
            data['prescription'].append({
                'drug': {
                    'name': choice(drugs)
                },
                'drug_order': choice(orders)
            })

        data['initial_vitalsigns'] = random_encounter(1)

        return data


    patient = {
        'hospital_no': '{}'.format(randint(100000, 999999)),
        'national_id_no': 'A{}'.format(randint(100000, 999999)),
        'name': fake.name(),
        'time_of_birth': datetime.datetime(
            randint(1900,1999),
            randint(1,12),
            randint(1, 25)
        ).isoformat(),
        'sex': choice(['M','F']),
        'allergies': fake.paragraph(),
        'phone_no': fake.phone_number(),
        'permanent_address': fake_address(),
        'current_address': fake_address(),
    }

    admission = make_admission(patient, bed, doctor)

    admit_post_result = conn.post_json(
        index['admissions'],
        admission
    )

    pprint(admit_post_result)


def register_random_patient(conn):
    index = conn.get(conn.index_url)
    
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
    patient = {
        'hospital_no': '{}'.format(randint(100000, 999999)),
        'national_id_no': 'A{}'.format(randint(100000, 999999)),
        'name': fake.name(),
        'time_of_birth': datetime.datetime(
            randint(1900,1999),
            randint(1,12),
            randint(1, 25)
        ).isoformat(),
        'sex': choice(['M','F']),
        'allergies': fake.paragraph(),
        'phone_no': fake.phone_number(),
        'permanent_address': fake_address(),
        'current_address': fake_address(),
    }

    patient_post_result = conn.post_json(
        index['patients'],
        patient
    )

    error = patient_post_result.pop('error', None)
    if error:
        print("Could Not Register")
        print(patient_post_result)
        print("")
        return

    print("Registered Patient {}".format(patient['name']))


def register_and_admit_random_patient(conn, no_discharge=False):
    problems_count = 5
    admissions_count = 5
    encounters_count = 20
    precription_count = 5

    index = conn.get(conn.index_url)

    wards = conn.get(index['wards'])['items']
    ward = conn.get(choice(wards)['url'])

    beds = conn.get(ward['beds'])['items']
    bed = conn.get(choice(beds)['url'])

    doctors = conn.get(index['personnel']['doctors'])['items']
    doctor = conn.get(choice(doctors)['url'])

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

    def random_encounter(i=None):
        types = [
            'measurements',
            'vitalsigns',
            'vitalsignsextended',
            'surgicalprocedure',
            'imaging',
            'endoscopy',
            'histopathology',
            'otherreport',
            'completebloodcount',
            'renalfunctiontest',
            'liverfunctiontest',
            'othertest',
            'otherencounter',
            'progress'
        ]
        result = {
            'type': types[i] if i else choice(types),
            'start_time': datetime.datetime.now().isoformat(),
            'end_time': datetime.datetime.now().isoformat(),
            'personnel_id': doctor['id']
        }
        if result['type'] == 'measurements':
            result['weight'] = float(randint(30, 100)) + 0.5
            result['height'] = 1.0 + (random() * 0.9)
        elif result['type'] == 'vitalsigns':
            result['pulse_rate'] = randint(60, 100)
            result['respiratory_rate'] = randint(12, 24)
            result['diastolic_bp'] = randint(50, 60)
            result['systolic_bp'] =  result['diastolic_bp'] + randint(0, 60)
            result['temperature'] = float(randint(36,39)) + random()
        elif result['type'] == 'vitalsignsextended':
            result['pulse_rate'] = randint(60, 100)
            result['respiratory_rate'] = randint(12, 24)
            result['diastolic_bp'] = randint(50, 60)
            result['systolic_bp'] =  result['diastolic_bp'] + randint(0, 60)
            result['temperature'] = float(randint(36,39)) + random()
            result['cvp'] = float(randint(5, 20))
            result['diastolic_ibp'] = randint(50, 60)
            result['systolic_ibp'] = result['diastolic_ibp'] + randint(0, 60)
        elif result['type'] == 'surgicalprocedure':
            result['assistant'] = "Dr. {}".format(fake.name())
            result['anesthetist'] = "Dr. {}".format(fake.name())
            result['nurse'] = "S/N. {}".format(fake.name())
            result['emergency'] = choice([True, False])
            result['preoperative_diagnosis'] = fake.paragraph()
            result['postoperative_diagnosis'] = fake.paragraph()
            result['procedure_name'] = fake.paragraph()
            result['findings'] = fake.paragraph()
            result['steps'] = fake.paragraph()
        elif result['type'] == 'imaging':
            result['site'] = fake.paragraph()
            result['imaging_type'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['radiologist'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'endoscopy':
            result['site'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['endoscopist'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'endoscopy':
            result['site'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['pathologist'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'otherreport':
            result['name'] = fake.paragraph()
            result['report'] = fake.paragraph()
            result['impression'] = fake.paragraph()
            result['reported_by'] = "Dr. {}".format(fake.name())
        elif result['type'] == 'completebloodcount':
            result['hemoglobin'] = random() * 100
            result['tlc'] = random() * 100
            result['plt'] = random() * 100
            result['dlc_n'] = random() * 100
            result['dlc_l'] = random() * 100
            result['dlc_m'] = random() * 100
            result['dlc_e'] = random() * 100
        elif result['type'] == 'renalfunctiontest':
            result['urea'] = random() * 100
            result['creatinine'] = random() * 100
        elif result['type'] == 'liverfunctiontest':
            result['t_bil'] = random() * 100
            result['d_bil'] = random() * 100
            result['alt'] = random() * 100
            result['ast'] = random() * 100
            result['alp'] = random() * 100
        elif result['type'] == 'othertest':
            result['name'] = choice(['Spam', 'Cheez', 'Donuts', 'Calrity'])
            result['value'] = str(random() * 100)
            result['unit'] = choice(['cm/L', 'eggs/banana', 'tomatoes/m^3'])
        elif result['type'] == 'otherencounter':
            result['title'] = fake.paragraph()
            result['note'] = fake.paragraph()
        elif result['type'] == 'progress':
            result['subjective'] = fake.paragraph()
            result['objective'] = fake.paragraph()
            result['assessment'] = fake.paragraph()
            result['plan'] = fake.paragraph()

        return result

    def admit(patient, bed, doctor):
        data = {
            'bed_id': bed['id'],
            'personnel_id': doctor['id']
        }
        for field in admission_fields:
            data[field] = fake.paragraph()
        admission_post_result = conn.post_json(
            patient['admissions'],
            data
        )
        error = admission_post_result.pop('error', None)
        if error:
            print("Could Not Admit")
            print(admission_post_result)
            return

        admission = conn.get(admission_post_result['url'])
        print("Admitted {}".format(admission['url']))

        #Add Problems to Admission
        problems_list = []
        for i in range(randint(1, problems_count)):
            problems_list.append({
                'start_time': datetime.datetime.now().isoformat(),
                'icd10class': {
                    'code': choice(["A","B","C"]) + "0" + str(randint(1,9))
                },
                'comment': fake.paragraph()
            })
        problem_post_result = conn.post_json(
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
            encounter_post_result = conn.post_json(
                admission['encounters_url'],
                random_encounter()
            )
            error = encounter_post_result.pop('error', None)
            if error:
                print("Could not add child encounter")
                print(encounter_post_result)

        #Add Prescription
        meds = []
        for i in range(randint(1, precription_count)):
            meds.append({
                'drug': {
                    'name': choice(drugs)
                },
                'drug_order': choice(orders)
            })
        presc_post_result = conn.post_json(
            admission['prescription_url'],
            meds
        )
        if isinstance(presc_post_result, dict):
            error = presc_post_result.pop('error', None)
            if error:
                print("Could not add medications to admission")
                print(presc_post_result)

        if no_discharge:
            return admission

        #Discharge the patient
        discharge_result = conn.post_json(
            admission['discharge'],
            {}
        )
        error = discharge_result.pop('error', None)
        if error:
            print("Could not discharge")
            print(discharge_result)
        print("Discharged")
        return admission


    #Register a patient
    patient_post_result = conn.post_json(
        index['patients'],
        {
            'hospital_no': '{}'.format(randint(100000, 999999)),
            'national_id_no': 'A{}'.format(randint(100000, 999999)),
            'name': fake.name(),
            'time_of_birth': datetime.datetime(
                randint(1900,1999),
                randint(1,12),
                randint(1, 25)
            ).isoformat(),
            'sex': choice(['M','F']),
            'allergies': fake.paragraph(),
            'phone_no': fake.phone_number(),
            'permanent_address': fake_address(),
            'current_address': fake_address(),
        }
    )
    error = patient_post_result.pop('error', None)
    if error:
        print("Could Not Register")
        print(patient_post_result)
        print("")
        return

    patient = conn.get(patient_post_result['url'])

    print("Registered {} {} {}".format(
        patient['national_id_no'],
        patient['name'],
        patient['url'])
    )

    #Admit the patient
    for i in range(randint(2, admissions_count)):
        wards = conn.get(index['wards'])['items']
        ward = conn.get(choice(wards)['url'])

        beds = conn.get(ward['beds'])['items']
        bed = conn.get(choice(beds)['url'])

        doctors = conn.get(index['personnel']['doctors'])['items']
        doctor = conn.get(choice(doctors)['url']) 

        admit(patient, bed, doctor)

    print("")




def admittest(conn):
    #for i in range(2):
    #    self.register_and_admit_random_patient()

    register_and_admit_random_patient_single_request(conn)

    register_random_patient(conn)
    
    """
    ward_index = 1
    bed_index = 2
    doctor_index = 1
    patient_index = 2
    index = conn.get(conn.index_url)

    wards = conn.get(index['wards'])['items']
    ward = conn.get(wards[ward_index]['url'])
    beds = conn.get(ward['beds'])['items']
    bed = beds[bed_index]
    print(bed)

    doctors = conn.get(index['personnel']['doctors'])['items']
    #print(doctors)
    doctor = conn.get(doctors[doctor_index]['url'])
    print(doctor)
    
    patients = conn.get(index['patients'])['items']
    patient = conn.get(patients[patient_index]['url'])
    active_admissions = conn.get(patient['admissions_active'])

    print("")

    if active_admissions is not None:
        print("Already Admitted")
        active_admission = conn.get(active_admissions['items'][0]['url'])
        print("Discharging")
        result = conn.post_json(
            active_admission['discharge'],
            {}
        )
        print(result)

    print("Admitting Patient")
    result = conn.post_json(
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

    patient = conn.get(patients[patient_index]['url'])
    active_admissions = conn.get(patient['admissions_active'])
    active_admission = conn.get(active_admissions['items'][0]['url'])
    print("Discharging")
    result = conn.post_json(
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
    result = conn.post_json(
        patient['admissions'],
        data
    )
    print(result)

    patient = conn.get(patients[patient_index]['url'])
    active_admissions = conn.get(patient['admissions_active'])
    active_admission = conn.get(active_admissions['items'][0]['url'])
    print("Discharging")
    result = conn.post_json(
        active_admission['discharge'],
        {}
    )
    print(result)

    problems = conn.get(active_admission['problems_url'])

    result = conn.post_json(
        active_admission['problems_url'],
        [
            {   
                'icd10_class_code': choice(["A","B","C"]) + "0" + str(randint(1,9))
            }
        ]
    )
    print(result)
    """