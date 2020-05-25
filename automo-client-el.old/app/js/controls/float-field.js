TextField = require("./text-field");


class FloatField extends TextField {
    constructor(elementId, name, options={}) {
        super(elementId, name, options);
    }

    val() {
        var value = super.val();
        var valueFloat = +value;
        return valueFloat;
    }

    isValid() {
        if (!super.isValid()) {
            return false
        }
        if (isNaN(this.val())) {
            return false;
        }
        return true
    }
}

module.exports = FloatField;
