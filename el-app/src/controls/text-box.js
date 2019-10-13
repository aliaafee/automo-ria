const Control = require("./control");

class TextBox extends Control {
    constructor(options) {
        super(options);
    }

    value() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
    }

    createElement() {
        this.element = document.createElement('input');
        if (this.options.onKeyUp) {
            this.element.addEventListener('keyup', (ev) => {
                this.options.onKeyUp(ev);
            })
        }
        
        return this.element
    }

}

module.exports = TextBox;