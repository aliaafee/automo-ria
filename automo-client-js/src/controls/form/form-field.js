const Field = require("./field")
const Form = require("./form")

module.exports = class FormField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this.form = new Form(
            {
                compact: true
            }
        )
    }

    value() {
        if (this.isBlank()) {
            return null
        }
        return this.form.value();
    }

    setValue(value) {
        if (!value) {
            this.form.clear()
            return
        }

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
        var valid = false;
        if (this.options.required == true || !this.isBlank()) {
            var valid = this.form.validate()
            if (!valid) {
                this.markInvalid()
            }
            return valid;
        }

        this.markValid();
        this.form._fields.forEach((field) => {
            field.markValid()
        })
        return true
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

        return this.element
    }

}