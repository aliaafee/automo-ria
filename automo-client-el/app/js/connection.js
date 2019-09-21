const status = require("./status")
const User = require("./user")


class Connection {
    constructor(logger) {
        this.index_url = null
        this.user = null;
        this.logger = logger;
    }


    login(index_url, username, password, on_success, on_failed) {
        this.logger.log_spinner(`User '${username}' attemting to login...`);
        this.index_url = index_url;
        this.user = new User();
        this.user.login(
            index_url,
            username,
            password,
            () => {
                on_success();
                this.logger.log_success(`User '${username}' logged in.`);
            },
            (error) => {
                on_failed(error);
                this.logger.log_error(`Login failed for '${username}'. ${error.message}`);
            }
        )
    }


    logout(on_success, on_failed) {
        this.user = null;
        on_success();
    }


    isLoggedIn() {
        if (this.user === null) {
            return false;
        }
        if (!(this.user.tokenValid())) {
            return false;
        }
        return true
    }


    _get(url, on_success, on_failed, refetchTokenOnFail = true) {
        let headers = this.user.getAuthorizationHeaders();

        fetch(url, { method: 'GET', headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                this.logger.log_success(`GET ${url}`)
                on_success(data);
            })
            .catch(error => {
                if (refetchTokenOnFail ? (error.status == 401) : false) {
                    this.user.getToken(
                        () => {
                            this._get(url, on_success, on_failed, false)
                        },
                        (getTokenError) => {
                            this.logger.log_error(`GET ${url} failed. ${getTokenError.message}`);
                            on_failed(getTokenError);
                        }
                    );
                } else {
                    this.logger.log_error(`GET ${url} failed. ${error.message}.`)
                    on_failed(error);
                }
            })
    }


    get(url, on_success, on_failed) {
        this.logger.log_spinner(`GET ${url}...`)
        if (this.user == null) {
            on_failed(new Error("User not logged in"));
            return;
        }
        if (!this.user.tokenValid()) {
            this.user.getToken(
                () => { this._get(url, on_success, on_failed) },
                (error) => {
                    this.logger.log_error(`GET ${url} failed. Failed to renew token.`)
                    on_failed(error)
                }
            );
            return;
        }
        this._get(url, on_success, on_failed);
    }
}

module.exports = Connection;
