const WizardPage = require('./wizard-page')
const Form = require('../../controls/form/form')

module.exports = class WizardForm extends WizardPage {
    constructor(options) {
        super(options)

        this.form = new Form(
            {
                title: options.title,
                labelTop: true,
            }
        )
    }

    validate() {
        return this.form.validate()
    }

    value() {
        return this.form.value()
    }

    setValue(value) {
        this.form.setValue(value)
    }

    createElement() {
        super.createElement()

        this.element.appendChild(this.form.createElement())

        return this.element;
    }
}