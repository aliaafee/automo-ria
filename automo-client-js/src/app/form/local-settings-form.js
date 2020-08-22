const Form = require('../../controls/form/form')
const DepartmentField = require('./department-field')


module.exports = class LocalSettingsForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(
            new DepartmentField(
                'department',
                {
                    label: 'Current Hospital and Department',
                    required: true
                }
            )
        )

    }

}