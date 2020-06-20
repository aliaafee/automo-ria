const Control = require("./control");

const VALID_TYPES = ['text', 'date', 'datetime-local', 'password', 'email', 'tel', 'number', 'time', 'url']

module.exports = class TextBox extends Control {
    constructor(options) {
        /* Options
         *  placeholder=""
         *  type=VALID_TYPE or textarea
         *  rows=2
         *  grow
         *  maxGrow
         */
        super(options);
    }

    value() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
        if (this.options.grow && this.options.type == 'textarea') {
            //requestAnimationFrame(() => {
                this._fitToContents()
            //})
        }
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

    _fitToContents() {
        this.element.style.overflow = 'hidden'
        this.element.style.height = '';
        var height = this.element.scrollHeight + 2
        if (this.options.maxGrow) {
            if (height > this.options.maxGrow) {
                height = this.options.maxGrow
                this.element.style.overflow = 'auto'
            }
        }
        this.element.style.height = height + 'px';
    }

    createElement() {
        if (this.options.type == 'textarea') {
            this.element = document.createElement('textarea');
            if (this.options.rows != null) {
                this.element.style.height = `${this.options.rows}em`
            } else {
                this.element.rows = 1
            }
            
            if (this.options.resize != true) {
                this.element.style.resize = 'none'
            }
            if (this.options.grow == true) {
                this.element.addEventListener('input', (event) => {
                    this._fitToContents()
                })
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
