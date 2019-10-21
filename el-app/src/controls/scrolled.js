const Control = require("./control");

module.exports = class Scrolled extends Control {
    constructor(options) {
        super(options);
    }

    scrollTo(position) {
        this.element.scrollTo(position);
    }

    createElement() {
        super.createElement();

        this.element.style.overflowX = 'none';
        this.element.style.overflowY = 'auto';
        this.element.classList.add('scrolled');

        return this.element;
    }
}
