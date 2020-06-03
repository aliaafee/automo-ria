const TextField = require("../../controls/form/text-field")

module.exports = class BedField extends TextField {
    constructor(name, options={}) {
        super(name, options);

        this._value = null;
    }

    value() {
        return this._value;
    }

    displayValue() {
        if (this._value == null) {
            return "";
        }
        return this._value.ward.name + ' - ' + this._value.number
    }

    setValue(value) {
        this._value = value;
        super.setValue(value);

        //this._textBox.setValue(this.displayValue());
    }
}