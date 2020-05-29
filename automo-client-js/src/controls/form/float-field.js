const TextField = require("./text-field");


module.exports = class FloatField extends TextField {
    constructor(name, options = {}) {
        options.type = 'number';
        super(name, options);
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