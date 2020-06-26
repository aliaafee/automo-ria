const Control = require("../control");
const Button = require("../button");

module.exports = class ResourcePanel extends Control {
    constructor (form, options={}) {
        super(options);

        this.form = form

        this._data = null

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
            this._errorElem.innerHTML = "Marked fields are not valid"
            return
        }

        if (!this._data.url) {
            this._errorElem.innerHTML = "No target URL found"
            return
        }

        console.log(this.form.value())

        connection.post(
            this._data.url,
            this.form.value(),
            (response) => {
                //console.log(response)
                //this._errorElem.innerHTML = "Succes"
                console.log(response)
                if (response.error) {
                    this._errorElem.innerHTML = response.error
                    if (response.invalid_fields) {
                        this.form.markInvalidFields(response.invalid_fields)
                    }
                    return
                }
                this._errorElem.innerHTML = "Saved"
                this.form.setValue(response)
                this.form.lock()
                this.btnEdit.show()
                this.btnSave.hide()
                this.btnCancel.hide()
            },
            (error) => {
                this._errorElem.innerHTML = `Failed ${error}`
            }
        )
    }

    setValue(value) {
        this._data = value

        this.form.setValue(this._data)
    }

    value() {
        this.form.value()
    }

    createElement() {
        super.createElement()
        this.element.style.display = 'block'

        var toolBar = document.createElement('div');
        toolBar.className = 'toolbar'
        this.element.appendChild(toolBar)

        if (this.options.title) {
            var titleElem = document.createElement('h1')
            titleElem.innerHTML = this.options.title
            this.element.appendChild(titleElem)
        }

        toolBar.appendChild(this.btnEdit.createElement())
        toolBar.appendChild(this.btnSave.createElement())
        toolBar.appendChild(this.btnCancel.createElement())

        this._errorElem = document.createElement('div')
        this._errorElem.className = 'error'

        this.element.appendChild(toolBar)
        this.element.appendChild(this._errorElem)
        this.element.appendChild(this.form.createElement())

        this.form.lock()
        this.btnEdit.show()
        this.btnSave.hide()
        this.btnCancel.hide()

        return this.element
    }
}