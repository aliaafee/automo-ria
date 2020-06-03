const TextField = require("../../controls/form/text-field")

module.exports = class BedField extends TextField {
    constructor(name, options={}) {
        super(name, options);

        this._value = null;
    }

    setValue(value) {
        super.setValue(value);
        
        this._value = value;

        if (value == null) {
            this._textBox.setValue("");
            return;
        }
        this._textBox.setValue(
            value.ward.name + ' - ' + value.number
        )
    }
}