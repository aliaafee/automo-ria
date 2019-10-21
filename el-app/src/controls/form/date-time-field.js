const TextField = require("./text-field");


module.exports = class DateTimeField extends TextField {
    constructor(name, options = {}) {
        options.type = 'datetime-local';
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