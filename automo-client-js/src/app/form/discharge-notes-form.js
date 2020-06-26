const Form = require('../../controls/form/form')
const TextField = require('../../controls/form/text-field')


module.exports = class DischargeNotesForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new TextField(
            'hospital_course',
            {
                label: 'Summary of Hospital Course',
                type: 'textarea',
                required: true,
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'discharge_advice',
            {
                label: 'Discharge Advice',
                type: 'textarea',
                required: true,
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'follow_up',
            {
                label: 'Follow Up',
                type: 'textarea',
                required: true,
                labelTop: true,
                grow: true
            }
        ))
    }
}