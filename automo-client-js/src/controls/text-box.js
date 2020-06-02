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

        this._locked = false;
        this._lockedValue = null;
        this._parentElement = null;
    }

    value() {
        if (this._locked) {
            return this._lockedValue;
        }

        return this.element.value;
    }

    setValue(value) {
        if (this._locked) {
            this._lockedValue = value;
            this.element.innerHTML = value;
            return;
        }
        this.element.value = value;
    }

    isBlank() {
        if (this._locked) {
            if (this._lockedValue == '') {
                return true
            }
            return false;
        }

        if (this.element.value == '') {
            return true;
        }
        return false;
    }

    lock() {
        //this.element.setAttribute('readonly', '');
        this._locked = true;
        this._lockedValue = this.value();
        this._parentElement = this.element.parentElement;

        this._parentElement.removeChild(this.element);
        this.element = document.createElement('div');
        this.element.className = 'locked-text-box'
        this._parentElement.appendChild(this.element);

        this.element.innerHTML = this._lockedValue;
    }

    unlock() {
        //this.element.removeAttribute('readonly');
        if (!this._locked) {
            return
        }

        this._locked = false;

        this._parentElement.removeChild(this.element);
        this.element = this.createElement();
        this._parentElement.appendChild(this.element);

        this.element.value = this._lockedValue;
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
