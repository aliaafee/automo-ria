const moment = require('moment');

const TextField = require("./text-field");


module.exports = class DateField extends TextField {
    constructor(name, options = {}) {
        options.type = 'date';
        super(name, options);

        this._value = null;
    }

    value() {
        var value = super.value()
        if (!value) {
            return null
        }
        var datetime = moment(value, "YYYY-MM-DD").toDate();
        return datetime;
    }

    setValue(value) {
        if (!value) {
            super.setValue("")
            return
        }
        this._value = moment(value);
        super.setValue(this._value.format('YYYY-MM-DD'))
    }

    lock() {
        this._locked = true;
        if (this.value() == null) {
            this.element.style.display = 'none';
        }
        this._textBox.lock();
        this.element.classList.add('locked')
    }

    unlock() {
        this._locked = false;
        this.element.style.display = 'flex';
        this._textBox.unlock();
        this.element.classList.remove('locked')
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