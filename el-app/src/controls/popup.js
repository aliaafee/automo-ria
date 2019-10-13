const Control = require("./control");

class Popup extends Control {
    constructor(referenceControl, options) {
        super(options);

        this.referenceControl = referenceControl
    }

    update() {
        
    }

    setPosition(top, left) {
        this.element.style.top = top;
        this.element.style.left = left;
    }

    createElement() {
        super.createElement();

        this.element.className = 'popup';
        this.element.style.position = 'absolute';
        this.element.innerHTML = "Yo man";
        this.element.style.width = this.options.width;
        this.element.style.height = this.options.height;

        return this.element;
    }
}

module.exports = Popup;