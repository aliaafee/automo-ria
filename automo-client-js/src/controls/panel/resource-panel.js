const Control = require("../control");
const Button = require("../button");
const Spinner = require("../spinner")

module.exports = class ResourcePanel extends Control {
    constructor (form, onSaved, options={}) {
        super(options);

        this.form = form
        this.onSaved = onSaved

        this._data = null

        this.spinner = new Spinner()

        this.btnExpand = new Button(
            '<span class="arrow"></span>',
            (event) => {
                this._onToggleExpand()
            },
            {
                className: 'expand-button',
                style: 'clear'
            }
        )

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

        this.spinner.show()
        this.form.lock()
        connection.post(
            this._data.url,
            this.form.value(),
            (response) => {
                console.log(response)
                if (response.error) {
                    this.form.unlock()
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
            },
            () => {
                this.spinner.hide()
            }
        )
    }

    _onToggleExpand() {
        if (this.element.classList.contains('collapsed')) {
            this.element.classList.remove('collapsed')
            return
        }
        this.element.classList.add('collapsed')
    }

    collapse() {
        this.element.classList.add('collapsed')
    }

    expand() {
        this.element.classList.remove('collapsed')
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

        var headerElement = document.createElement('div')
        headerElement.className = 'header'
        this.element.appendChild(headerElement)

        headerElement.appendChild(this.btnExpand.createElement())

        this.titleElement = document.createElement('div')
        this.titleElement.className = 'title'
        if (this.options.title) {
            this.titleElement.innerHTML = this.options.title
        }
        headerElement.appendChild(this.titleElement)

        var toolBarElement = document.createElement('div');
        toolBarElement.className = 'toolbar'
        headerElement.appendChild(toolBarElement)

        toolBarElement.appendChild(this.btnEdit.createElement())
        toolBarElement.appendChild(this.btnSave.createElement())
        toolBarElement.appendChild(this.btnCancel.createElement())

        this._statusElem = document.createElement('div')
        this._statusElem.className = 'resource-status'

        toolBarElement.prepend(this._statusElem)

        var bodyElement = document.createElement('div')
        bodyElement.className = 'body'
        this.element.appendChild(bodyElement)

        bodyElement.appendChild(this.spinner.createElement())
        bodyElement.appendChild(this.form.createElement())

        this.form.lock()
        this.btnEdit.show()
        this.btnSave.hide()
        this.btnCancel.hide()
        this.spinner.hide()

        return this.element
    }
}