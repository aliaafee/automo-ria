from getpass import getpass
from pprint import pprint


def process_command(command_list, conn):
    try:
        command = command_list.pop(0)
    except IndexError:
        command = None

    if command == 'user':
        return process_user_command(command_list, conn)

    print(
        "admin supported commands:\n"
        "   user <commands> - administer users, help for details\n"
    )
    return False


def process_user_command(command_list, conn):
    try:
        command = command_list.pop(0)
    except IndexError:
        command = None

    if command == 'list':
        return list_user(conn)

    if command == 'get':
        return get_user(command_list, conn)

    if command == 'add':
        return add_user(command_list, conn)

    if command == 'pwd':
        return pwd_user(command_list, conn)

    if command == 'update':
        return update_user(command_list, conn)

    print(
        "user supported commands:\n"
        "  list - list all users\n"
        "  get <username> - get details of user\n"
        "  add <username> - add new user\n"
        "  pwd <username> - change password, blank username = current user\n"
        "  update <username> - update information of user\n"
    )
    return False


def list_user(conn):
    user_list = conn.get(
        conn.get_index()['users']
    )

    if not user_list:
        print("User list not accesible.")
        return True

    pprint(user_list)

    return True


def get_user(command_list, conn):
    try:
        username = command_list.pop(0)
    except IndexError:
        #print("Expected username")
        #return False
        username = conn.user.username

    current_data = conn.get(
        "{}{}".format(conn.get_index()['users'], username)
    )

    if not current_data:
        print("Cannot get user.")
        return True

    pprint(current_data)


def add_user(command_list, conn):
    try:
        username = command_list.pop(0)
    except IndexError:
        print("Expected username")
        return True

    print("Adding User '{}'".format(username))

    password = getpass("Password: ")
    fullname = input("Full Name: ")
    personnel_id = input("Personnel ID: ")

    result = conn.post_json(
        conn.get_index()['users'],
        {
            'username': username,
            'fullname': fullname,
            'password': password,
            'personnel': {
                'id': personnel_id
            }
        }
    )

    pprint(result)

    return True


def pwd_user(command_list, conn):
    try:
        username = command_list.pop(0)
    except IndexError:
        #print("Expected username")
        #return False
        username = conn.user.username

    data = {}

    if username == conn.user.username:
        data['current_password'] = getpass("Current Password: ")

    data['password'] = getpass("New Password: ")

    result = conn.post_json(
        "{}{}".format(conn.get_index()['users'], username),
        data
    )

    pprint(result)

    return True


def update_user(command_list, conn):
    try:
        username = command_list.pop(0)
    except IndexError:
        #print("Expected username")
        #return False
        username = conn.user.username

    current_data = conn.get(
        "{}{}".format(conn.get_index()['users'], username)
    )

    if not current_data:
        print("Cannot update user.")
        return True

    current_personnel_id = '-'
    if current_data['personnel']:
        if 'id' in current_data['personnel']:
            current_personnel_id = current_data['personnel']['id']

    new_data = {}

    fullname = input("Full Name({}): ".format(current_data['fullname']))
    if fullname:
        new_data['fullname'] = fullname

    personnel_id = input("Personnel ID({}): ".format(current_personnel_id))
    if personnel_id:
        new_data['personnel'] = {
            'id': personnel_id
        }

    if not new_data:
        print("Nothing changed")
        return True

    result = conn.post_json(
        "{}{}".format(conn.get_index()['users'], username),
        new_data
    )

    pprint(result)

    return True