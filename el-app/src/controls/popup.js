const Control = require("./control");

class Popup extends Control {
    constructor(referenceControl, options) {
        super(options);

        this.referenceControl = referenceControl
    }

    popup() {
        this.element.style.marginTop = (this.referenceControl.element.clientHeight) + 'px';
        this.element.style.width = (this.referenceControl.element.offsetWidth) + 'px';
        this.show();
    }

    createElement() {
        super.createElement();

        this.element.className = 'popup';
        this.element.style.position = 'absolute';
        this.element.style.width = this.options.width;
        this.element.style.height = this.options.height;

        this.hide();

        return this.element;
    }
}

module.exports = Popup;