const {ipcRenderer} = require('electron');

const load_patient = document.querySelector('.load-patient');
const logout_button = document.querySelector('.logout');
const result_section = document.querySelector('.result');


function status(response) {
  if (response.status !== 200) {
    return Promise.reject(new Error(response.statusText));
  }
  return Promise.resolve(response)
}


class User {
  constructor() {
    this.username = null;
    this.fullname = null
    this.password = null;
    this.token = null;
    this.token_expire_time = null;
    this.url = null;
    this.token_url = null;
  }

  tokenValid() {
    if (this.token === null) {
      console.log("No Token");      
      return false;
    }
    if ((new Date().getTime() / 1000) > this.token_expire_time) {
      console.log("Token Expired");
      this.token = null;
      this.token_expire_time = null;
      return false;
    }
    return true;
  }

  getToken(on_success, on_failed) {
    let headers = new Headers();
    headers.set(
      'Authorization',
      'Basic ' + btoa(this.username + ":" + this.password)
    );

    fetch(this.token_url, {metho: 'GET', headers: headers})
      .then(status)
      .then(response => response.json())
      .then(data => {
        this.token = data['token'];
        this.token_expire_time = (new Date().getTime() / 1000) + data['expiration'];
        on_success();
      })
      .catch(error => {
        console.log('Error Getting Token:', error);
        on_failed('Failed to get token.');
      })
  }

  getAuthorizationHeaders() {
    let headers = new Headers();
    headers.set(
      'Authorization',
      'Basic ' + btoa(this.token + ":")
    );
    return headers;
  }

  getUserData(on_success, on_failed) {
    let headers = this.getAuthorizationHeaders();

    fetch(this.url, {metho: 'GET', headers: headers})
      .then(status)
      .then(response => response.json())
      .then(data => {
        this.fullname = '';
        console.log(data);
        on_success();
      })
      .catch(error => {
        console.log('Error Getting User data:', error);
        on_failed('Failed to get user data');
      })
  }

  login(index_url, username, password, on_success, on_failed) {
    this.username = username;
    this.password = password;
  
    let headers = new Headers();
    headers.set(
      'Authorization',
      'Basic ' + btoa(this.username + ":" + this.password)
    );

    function checkCredentials(data){
      console.log(data);
      if (!("auth_token" in data)) {
        return Promise.reject(new Error("Unexpected data."));
      }
      return Promise.resolve(data)
    }

    fetch(index_url, {metho: 'GET', headers: headers})
      .then(status)
      .then(response => response.json())
      .then(data => checkCredentials(data))
      .then(data => {
        console.log('Login Success');
        this.token_url = data['auth_token'];
        this.getToken(
          () => {
            console.log("Getting Userdata");
            this.url = data['user'];
            this.getUserData(on_success, on_failed);
          }, 
          on_failed
        );
      })
      .catch(function(error) {
        console.log('Login Error:', error);
        on_failed('Login Error: ' + error.message);
      })
  }
  
}


class Connection {
  constructor () {
    this.index_url = null
    this.user = null;
  }

  login(index_url, username, password, on_success, on_failed) {
    this.index_url = index_url;
    this.user = new User();
    this.user.login(
      index_url,
      username,
      password,
      on_success,
      on_failed
    )
  }

  logout(on_success, on_failed) {
    this.user = null;
    on_success();
  }

  isLoggedIn () {
    if (this.user === null) {
      console.log("Connection: No Login User");
      return false;
    }
    if (!(this.user.tokenValid())) {
      console.log("Connection: Not Logged In");
      return false;
    }
    return true
  }

  _get(url, on_success, on_failed) {
    let headers = this.user.getAuthorizationHeaders();

    fetch(url, {metho: 'GET', headers: headers})
      .then(status)
      .then(response => response.json())
      .then(data => on_success(data))
      .catch(function(error) {
        console.log('Connection Get Error:', error);
        on_failed('Connection Get Error: ' + error.message);
      })
  }

  get(url, on_success, on_failed) {
    if (this.user == null) {
      on_failed("User not logged in");
      return;
    }
    if (!this.user.tokenValid()) {
      this.user.getToken(
        () => {this._get(url, on_success, on_failed)},
        on_failed
      );
      return;
    }
    this._get(url, on_success, on_failed);
  }
}


var conn = new Connection();

ipcRenderer.on('login-try', (event, arg) => {
  console.log("Trying to login");
  conn.login(
    arg['index_url'],
    arg['username'],
    arg['password'],
    () => {
      ipcRenderer.send('login-success')
    },
    (errorMessage) => {
      ipcRenderer.send('login-failed', errorMessage)
    }
  )
})

logout_button.addEventListener('click', () => {
  conn.logout(
    () => {
      ipcRenderer.send('logout')
    }
  )
})


function displayPatientList(data) {
  var result = "";

  data['patients'].forEach(element => {
    result += `<tr><td>${element['id']}</td><td>${element['name']}</td><td>${element['url']}</td></tr>`
  });

  result_section.innerHTML = `<table>${result}</table>`;
}


load_patient.addEventListener('click', function () {
  conn.get(
    conn.index_url,
    data => {
      conn.get(
        data['patients'],
        data => {
          displayPatientList(data)
        },
        error => {
          console.log("Failed", error);
        }
      )
    },
    errorMessage => {
      console.log("Failed:", errorMessage);
    }
  );
});
