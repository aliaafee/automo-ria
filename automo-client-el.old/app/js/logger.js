const feather = require('feather-icons');


class Logger {
    constructor () {
        this.status_bar = null;
    }

    setTarget(target) {
        this.status_bar = target;
    }

    log(message) {
        if (this.status_bar == null) {
            console.log(message);
            return;
        }
        this.status_bar.html(
            `<span class="text-secondary">${message}</span>`
        );
    }

    log_spinner(message) {
        if (this.status_bar == null) {
            console.log(message);
            return;
        }
        this.status_bar.html(
            `<span class="spinner-border spinner-border-sm"></span>
             <span> ${message}</span>`
        );
    }

    log_success(message) {
        if (this.status_bar == null) {
            console.log(message);
            return;
        }
        this.status_bar.html(
            '<span class="text-secondary">' +
            feather.icons['check-circle'].toSvg() + " " +
            message +
            '</span>'
        );
    }

    log_error(message) {
        if (this.status_bar == null) {
            console.log(message);
            return;
        }
        this.status_bar.html(
            '<span class="text-danger">' +
            feather.icons['alert-triangle'].toSvg() + " " +
            message +
            '</span>'
        );
    }
}

module.exports = Logger;