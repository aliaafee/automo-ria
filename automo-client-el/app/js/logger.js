const feather = require('feather-icons');


class Logger {
    constructor (status_bar) {
        this.status_bar = status_bar;
        this.status_bar.html("WHOHOHOH")
    }

    log_spinner(message) {
        this.status_bar.html(
            `<span class="spinner-border spinner-border-sm"></span>
             <span> ${message}...</span>`
        );
    }

    log_success(message) {
        this.status_bar.html(
            '<span class="text-success">' +
            feather.icons['check-circle'].toSvg() + " " +
            message +
            '</span>'
        );
    }

    log_error(message) {
        this.status_bar.html(
            '<span class="text-danger">' +
            feather.icons['alert-triangle'].toSvg() + " " +
            message +
            '</span>'
        );
    }
}

module.exports = Logger;