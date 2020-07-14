//const Control = require("../control");
const Button = require("../button");
const Spinner = require("../spinner");
const CollapsePanel = require("./collapse-panel");

module.exports = class ResourcePanel extends CollapsePanel {
    constructor (form, onSaved, options={}) {
        super(options);

        this.form = form
        this.onSaved = onSaved

        this._data = null

        this.spinner = new Spinner()

        this.btnEdit = new Button(
            'Edit',
            (event) => {
                this._onEdit()
            }
        )

        this.btnSave = new Button(
            'Save',
            (event) => {
                this._onSave()
            }
        )

        this.btnCancel = new Button(
            'Cancel',
            (event) => {
                this._onCancel()
            }
        )
    }

    _onEdit() {
        this.form.unlock()

        this.btnEdit.hide()
        this.btnSave.show()
        this.btnCancel.show()
    }

    _onCancel() {
        this.form.setValue(this._data)
        this.form.lock()

        this.btnEdit.show()
        this.btnSave.hide()
        this.btnCancel.hide()
    }

    _onSave() {
        if (!this.form.validate()) {
            this._statusElem.innerHTML = "Marked fields are not valid"
            return
        }

        if (!this._data.url) {
            this._statusElem.innerHTML = "No target URL found"
            return
        }

        console.log(this.form.value())

        this.btnSave.hide()
        this.btnCancel.hide()
        this.spinner.show()
        this.form.lock()
        connection.post(
            this._data.url,
            this.form.value(),
            (response) => {
                console.log(response)
                if (response.error) {
                    this.form.unlock()
                    this.btnSave.show()
                    this.btnCancel.show()
                    this._statusElem.innerHTML = response.error
                    if (response.invalid_fields) {
                        this._statusElem.innerHTML = "Marked fields are not valid"
                        this.form.markInvalidFields(response.invalid_fields)
                    } else {
                        this._statusElem.innerHTML = response.message
                    }
                    return
                }
                this._statusElem.innerHTML = "Saved"
                this.form.setValue(response)
                if (this.onSaved) {
                    this.onSaved(response)
                }
                this.btnEdit.show()
                this.btnSave.hide()
                this.btnCancel.hide()
            },
            (error) => {
                console.log(Object.keys(error))
                this._statusElem.innerHTML = `Could Not Save (${error.message})`
                this.form.unlock()
                this.btnSave.show()
                this.btnCancel.show()
            },
            () => {
                this.spinner.hide()
            }
        )
    }

    setValue(value) {
        this._data = value

        this.form.setValue(this._data)
        this.form.lock()
        this.btnEdit.show()
        this.btnSave.hide()
        this.btnCancel.hide()
        this._statusElem.innerHTML = ""
    }

    value() {
        this.form.value()
    }

    createElement() {
        super.createElement()

        this.element.classList.add('resource-panel')

        var toolBarElement = document.createElement('div');
        toolBarElement.className = 'toolbar'
        this.headerElement.appendChild(toolBarElement)

        toolBarElement.appendChild(this.btnEdit.createElement())
        toolBarElement.appendChild(this.btnSave.createElement())
        toolBarElement.appendChild(this.btnCancel.createElement())

        this._statusElem = document.createElement('div')
        this._statusElem.className = 'resource-status'

        toolBarElement.prepend(this._statusElem)

        this.bodyElement.appendChild(this.spinner.createElement())
        this.bodyElement.appendChild(this.form.createElement())

        this.form.lock()
        this.btnEdit.show()
        this.btnSave.hide()
        this.btnCancel.hide()
        this.spinner.hide()

        return this.element
    }
}