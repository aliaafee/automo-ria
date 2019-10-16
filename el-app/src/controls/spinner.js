const Control = require("./control");

class Spinner extends Control {
    constructor(options) {
        super(options);
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'spinner';

        return(this.element);
    }
}

module.exports = Spinner;