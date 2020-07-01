const Form = require('../../controls/form/form')
const ProblemsField = require("../form/problems-field")


module.exports = class ProblemsForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this._defaultStartTime = null

        this.addField(new ProblemsField(
            'problems',
            {
                required: true
            }
        ))
    }

    setValue(value) {
        if (value) {
            if (value.start_time) {
                this._defaultStartTime = value.start_time
            }
        }
        super.setValue(value)
    }

    value() {
        var value = super.value()

        value.problems.forEach((problem) => {
            if (!problem.start_time) {
                problem.start_time = this._defaultStartTime
            }
        })

        return value
    }
}