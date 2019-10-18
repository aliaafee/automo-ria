const Control = require("./control");

class Scrolled extends Control {
    constructor(options) {
        super(options);
    }

    createElement() {
        super.createElement();

        this.element.style.overflowX = 'none';
        this.element.style.overflowY = 'auto';
        this.element.classList.add('scrolled');

        return this.element;
    }
}

module.exports = Scrolled;
