const status = require("./status");


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


module.exports = User;
