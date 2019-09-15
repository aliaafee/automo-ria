const {status} = require("./status")
const User = require("./user")


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

module.exports = Connection;
