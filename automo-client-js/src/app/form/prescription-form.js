const Form = require('../../controls/form/form')
const PrescriptionField = require("../form/prescription-field")


module.exports = class PrescriptionForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new PrescriptionField(
            'prescription',
            {
                required: true
            }
        ))
    }
}