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

    isBlank() {
        if (this.element.value == '') {
            return true;
        }
        return false;
    }

    lock() {
        this.element.setAttribute('readonly', '');
    }

    unlock() {
        this.element.removeAttribute('readonly');
    }

    createElement() {
        this.element = document.createElement('input');
        if (this.options.onKeyUp) {
            this.element.addEventListener('keyup', (ev) => {
                this.options.onKeyUp(ev);
            })
        }

        if (this.options.placeholder != null) {
            this.element.setAttribute('placeholder', this.options.placeholder);
        }
        
        return this.element
    }

}

module.exports = TextBox;