const Dialog = require("./base-dialog");


class StatusDialog extends Dialog {
    constructor() {
        super("spinner-dialog");
        this.canDismiss = false;
        this.fade = false;
        this.centered = true
    }

    setLogger(logger) {
        logger.setTarget($("#dialog-body"));
    }

    getHeader() {
        return "";
    }

    getFooter() {
        return "";
    }
}

module.exports = StatusDialog;