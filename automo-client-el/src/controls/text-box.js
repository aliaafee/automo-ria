const Control = require("./control");

const VALID_TYPES = ['text', 'date', 'datetime-local', 'password', 'email', 'tel', 'number', 'time', 'url']

module.exports = class TextBox extends Control {
    constructor(options) {
        /* Options
         *  placeholder=""
         *  type=VALID_TYPE or textarea
         *  rows=2
         */
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
        if (this.options.type == 'textarea') {
            this.element = document.createElement('textarea');
            if (this.options.rows != null) {
                this.element.setAttribute('rows', this.options.rows);
            }
            if (this.options.resize != true) {
                this.element.style.resize = 'none'
            }
        } else {
            this.element = document.createElement('input');
            if (VALID_TYPES.includes(this.options.type)) {
                this.element.setAttribute('type', this.options.type);
            }
        }

        this.element.setAttribute('size', 1);

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
