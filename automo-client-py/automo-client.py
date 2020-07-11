
import requests

import datetime
import dateutil.relativedelta
from getpass import getpass
from pprint import pprint

from user import User
from connection import Connection
import tests
import admin

#For testing only
requests.packages.urllib3.disable_warnings(requests.urllib3.exceptions.SubjectAltNameWarning)


class ClientApp:
    def __init__(self, index_url):
        self.index_url = index_url
        self.user = None
        self.conn = Connection()
        self.last_command = ""
        self.running = True


    def process_command(self, command_str):
        command_list = command_str.split(" ")

        try:
            command = command_list.pop(0)
        except IndexError:
            return False

        if command == 'exit':
            self.running = False
            return True

        if command == 'help':
            print("Commands: help, exit, get_index, get <url>")
            return True

        if command == 'get':
            try:
                url = command_list.pop(0)
            except IndexError:
                return False
            
            if url == 'index':
                data = self.conn.get(self.index_url)
            else:
                data = self.conn.get(url)

            pprint(data)
            return True

        if command == 'admin':
            return admin.process_command(command_list, self.conn)

        if command == 'test':
            return tests.process_command(command_list, self.conn)

        print("Unknown Command")
        return False


    def start(self):
        while self.running:
            while not self.conn.is_loggedin():
                self.conn.login(
                    self.index_url,
                    input("Username: "),
                    getpass("Password: ")
                )

            prompt = "{}@automo >> ".format(self.conn.user.username)
            command_str = input(prompt)

            if command_str == "":
                command_str = self.last_command
                print(command_str)

            if command_str:

                result = self.process_command(command_str)

                if result:
                    self.last_command = command_str
                else:
                    print("Command Error")

        print("Exiting")



def main():
    client_app = ClientApp('http://127.0.0.1:5000/api/')

    client_app.start()



if __name__ == '__main__':
    main()
