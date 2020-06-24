const TextField = require("../../controls/form/text-field")


module.exports = class BPField extends TextField {
    constructor(name, options = {}) {
        super(name, options)
    }

    value() {
        var value_string = super.value()

        var parts = value_string.split('/')

        if (parts.length != 2) {
            return null
        }

        return {
            'systolic_bp': parseFloat(parts[0]),
            'diastolic_bp': parseFloat(parts[1])
        }
    }

    setValue(value) {
        var value_str = null

        if (value.systolic_bp != null && value.diastolic_bp != null) {
            value_str = `${value.systolic_bp}/${value.diastolic_bp}`
        }

        super.setValue(value_str)
    }
}