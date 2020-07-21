const ResourcePanel = require("../../controls/panel/resource-panel")
const EncounterForms = require("../form/encounter-forms")
const Button = require("../../controls/button")
const ConfirmDialog = require("../../controls/dialog/confirm-dialog")


module.exports = class EncounterPanel extends ResourcePanel {
    constructor (onSaved, options={}) {
        var EncounterClass = EncounterForms[options.type]

        if (EncounterClass) {
            var form = new EncounterClass()
        } else {
            var form = new EncounterForms.encounter()
        }

        form.options.hideTitle = true;
        options.title = form.options.title;
        
        super(form, onSaved, options);

        this.btnDelete = new Button(
            'Delete',
            () => {
                this._onDelete()
            },
            {
                icon: 'trash',
                style: 'clear',
                className: 'alert'
            }
        )
    }

    transient() {
        super.transient()
        this.btnDelete.hide()
    }

    lock() {
        super.lock();
        this.btnDelete.hide()
    }

    unlock() {
        super.unlock();
        this.btnDelete.show()
    }

    _delete() {
        if (this._data ? !this._data.url : true ) {
            this.hide();
            return
        }

        this.spinner.show()
        this.transient()
        connection.delete(
            this._data.url,
            (response) => {
                console.log(response)
                this.lock()
                this.hide()
            },
            (error) => {
                this.statusElem.innerHTML = `Could Not Delete`
                this.unlock()
            },
            () => {
                console.log("Finally")
                this.spinner.hideSoft()
            }
        )
    }

    _onDelete() {
        console.log("Delete")

        var confirm = new ConfirmDialog()

        confirm.show(
            "Delete Encounter",
            "Are you sure you want to delete this encounter? This operation is not reversible",
            () => {
                this._delete()
            },
            () => {}
        )
    }

    createElement() {
        super.createElement()

        this.toolBarElement.insertBefore(this.btnDelete.createElement(), this.btnSave.element)

        this.btnDelete.hide()

        return this.element
    }

}