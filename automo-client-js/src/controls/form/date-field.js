const moment = require('moment');

const TextField = require("./text-field");


module.exports = class DateField extends TextField {
    constructor(name, options = {}) {
        options.type = 'date';
        super(name, options);

        this._value = null;
    }

    value() {
        var datetime = moment(super.value());
        return datetime;
    }

    setValue(value) {
        super.setValue(value);
        this._value = moment(value);
        this._textBox.setValue(this._value.format('YYYY-MM-DD'));
    }

    lock() {
        this._locked = true;
        if (this.value() == null) {
            this.element.style.display = 'none';
        }
        this._textBox.lock();
    }

    unlock() {
        this._locked = false;
        this.element.style.display = 'flex';
        this._textBox.unlock
    }
    

    isValid() {
        if (!super.isValid()) {
            return false;
        }
        if (isNaN(this.value())){
            return false;
        }
        return true;
    }
}