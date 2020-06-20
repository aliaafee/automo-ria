const Field = require("../../controls/form/field")
const Form = require("../../controls/form/form")
const TextField = require("../../controls/form/text-field")

module.exports = class AddressField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this.form = new Form(
            {
                compact: true
            }
        )

        this.form.addField(
            new TextField(
                'line_1',
                {
                    placeholder: 'Line 1'
                }
            )
        )

        this.form.addField(
            new TextField(
                'line_2',
                {
                    placeholder: 'Line 2'
                }
            )
        )

        this.form.addField(
            new TextField(
                'line_3',
                {
                    placeholder: 'Line 3'
                }
            )
        )

        this.form.addField(
            new TextField(
                'city',
                {
                    placeholder: 'City',
                    required: true
                }
            )
        )

        this.form.addField(
            new TextField(
                'region',
                {
                    placeholder: 'Region'
                }
            )
        )

        this.form.addField(
            new TextField(
                'country',
                {
                    placeholder: 'Country',
                    required: true
                }
            )
        )

        this.form.addField(
            new TextField(
                'phone_no',
                {
                    placeholder: 'Phone Number'
                }
            )
        )

        'line_1',
        'line_2',
        'line_3',
        'city',
        'region',
        'country',
        'phone_no'
    }

    value() {
        return this.form.value();
    }

    setValue(value) {
        super.setValue(this.value)
        this.form.setValue(value)
    }

    isBlank() {
        return this.form.isBlank();
    }

    isValid() {
        if (this.options.required == true) {
            return this.form.isValid()
        }
        if (!this.isBlank()) {
            return this.form.isValid()
        }
        return true
    }

    validate() {
        if (this.options.required == true) {
            return this.form.validate()
        }
        if (!this.isBlank()) {
            return this.form.validate()
        }
        this.form._fields.forEach((field) => {
            field.markValid()
        })
        return true
    }

    markInvalid() {
        return
    }

    markValid() {
        return
    }

    lock() {
        super.lock()

        this.form.lock()
    }

    unlock() {
        super.unlock()

        this.form.unlock()
    }

    createElement() {
        super.createElement()

        this._placeholderElement.appendChild(this.form.createElement())
        this.form.element.style.flexGrow = 1

        return this.element
    }

}