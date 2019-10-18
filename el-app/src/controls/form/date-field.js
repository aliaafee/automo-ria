const TextField = require("./text-field");


class DateField extends TextField {
    constructor(name, options = {}) {
        options.type = 'date';
        super(name, options);
    }

    value() {
        var datetime = new Date(super.value());
        return datetime;
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

module.exports = DateField;