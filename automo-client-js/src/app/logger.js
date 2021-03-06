//const feather = require('feather-icons');


module.exports = class Logger {
    constructor () {
        this.statusElement = null;
    }

    setTarget(target) {
        this.statusElement = target;
    }

    log(message) {
        if (this.statusElement == null) {
            console.log(message);
            return;
        }
        this.statusElement.innerText = message;
    }

    log_spinner(message) {
        if (this.statusElement == null) {
            //console.log(message);
            return;
        }
        this.statusElement.innerText = message;
    }

    log_success(message) {
        if (this.statusElement == null) {
            //console.log(message);
            return;
        }
        this.statusElement.innerText = message;
    }

    log_error(message) {
        if (this.statusElement == null) {
            console.log(message);
            return;
        }
        this.statusElement.innerText = message;
    }
}