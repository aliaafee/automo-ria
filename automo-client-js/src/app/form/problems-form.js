const Form = require('../../controls/form/form')
const ProblemsField = require("../form/problems-field")


module.exports = class ProblemsForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new ProblemsField(
            'problems',
            {
                required: true
            }
        ))
    }
}