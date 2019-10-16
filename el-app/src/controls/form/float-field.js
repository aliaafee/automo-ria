const TextField = require("./text-field");


class FloatField extends TextField {
    constructor(name, label, options) {
        options.type = 'number';
        super(name, label, options);
    }

    value() {
        var value = super.value();
        return +value;
    }

    isValid() {
        if (!super.isValid()) {
            return false;
        }
        if (isNaN(this.value())) {
            return false;
        }
        return true;
    }
}

module.exports = FloatField;