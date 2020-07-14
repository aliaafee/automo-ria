const status = require("./status")
const User = require("./user")


module.exports = class Connection {
    constructor(logger) {
        this.index_url = null
        this.resource_index = {}
        this.user = null;
        this.logger = logger;
    }


    login(index_url, username, password, on_success, on_failed, on_finally) {
        this.index_url = index_url;
        this.user = new User();
        this.user.login(
            index_url,
            username,
            password,
            (resource_index) => {
                this.resource_index = resource_index;
                on_success();
                on_finally != null ? on_finally() : false;
            },
            (error) => {
                on_failed(error);
                on_finally != null ? on_finally() : false;
            }
        )
    }

    resourceFromPath(pathList) {
        var result = this.resource_index
        pathList.forEach((key) => {
            result = result[key]
        })
        return result
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


    _authenticate_and_execute(func, on_failed, on_finally) {
        if (this.user == null) {
            on_failed(new Error("User not logged in"));
            on_finally != null ? on_finally() : false;
            return;
        }
        if (!this.user.tokenValid()) {
            this.user.getToken(
                () => {
                    func()
                },
                (error) => {
                    on_failed(error)
                    on_finally != null ? on_finally() : false;
                }
            );
            return;
        }
        func()
    }


    _get(url, on_success, on_failed, on_finally, refetchTokenOnFail = true, method='GET') {
        let headers = this.user.getAuthorizationHeaders();

        fetch(url, { method: method, headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                on_success(data);
                on_finally != null ? on_finally() : false;
            })
            .catch(error => {
                if (refetchTokenOnFail ? (error.status == 401) : false) {
                    this.user.getToken(
                        () => {
                            this._get(url, on_success, on_failed, on_finally, false)
                        },
                        (getTokenError) => {
                            on_failed(getTokenError);
                            on_finally != null ? on_finally() : false;
                        }
                    );
                } else {
                    on_failed(error);
                    on_finally != null ? on_finally() : false;
                }
            })
    }


    get(url, on_success, on_failed, on_finally) {
        this._authenticate_and_execute(
            () => {
                this._get(url, on_success, on_failed, on_finally)
            },
            on_failed,
            on_finally
        )
    }


    delete(url, on_success, on_failed, on_finally) {
        this._authenticate_and_execute(
            () => {
                this._get(url, on_success, on_failed, on_finally, true, 'DELETE')
            },
            on_failed,
            on_finally
        )
    }


    _get_blob(url, on_success, on_failed, on_finally, refetchTokenOnFail = true) {
        let headers = this.user.getAuthorizationHeaders();

        fetch(url, { method: 'GET', headers: headers })
            .then(status)
            .then(response => response.blob())
            .then(blob => {
                on_success(blob);
                on_finally != null ? on_finally() : false;
            })
            .catch(error => {
                if (refetchTokenOnFail ? (error.status == 401) : false) {
                    this.user.getToken(
                        () => {
                            this._get(url, on_success, on_failed, on_finally, false)
                        },
                        (getTokenError) => {
                            on_failed(getTokenError);
                            on_finally != null ? on_finally() : false;
                        }
                    );
                } else {
                    on_failed(error);
                    on_finally != null ? on_finally() : false;
                }
            })
    }


    get_blob(url, on_success, on_failed, on_finally) {
        this.logger.log_spinner(`GET ${url}...`)
        this._authenticate_and_execute(
            () => {
                this._get_blob(url, on_success, on_failed, on_finally);
            },
            on_failed,
            on_finally
        )
    }

    _post(url, post_data, on_success, on_failed, on_finally, refetchTokenOnFail = true) {
        let headers = this.user.getAuthorizationHeaders();

        headers.set('Content-Type', 'application/json');

        fetch(url, { method: 'POST', body: JSON.stringify(post_data), headers: headers })
            .then(status)
            .then(response => response.json())
            .then(data => {
                on_success(data);
                on_finally != null ? on_finally() : false;
            })
            .catch(error => {
                if (refetchTokenOnFail ? (error.status == 401) : false) {
                    this.user.getToken(
                        () => {
                            this._post(url, post_data, on_success, on_failed, on_finally, false)
                        },
                        (getTokenError) => {
                            on_failed(getTokenError);
                            on_finally != null ? on_finally() : false;
                        }
                    );
                } else {
                    on_failed(error);
                    on_finally != null ? on_finally() : false;
                }
            })
    }


    post(url, post_data, on_success, on_failed, on_finally) {
        this._authenticate_and_execute(
            () => {
                this._post(url, post_data, on_success, on_failed, on_finally);
            },
            on_failed,
            on_finally
        )
    }
}