const querystring = require('querystring');
const Button = require("../../controls/button");
const CollapsePanel = require("../../controls/panel/collapse-panel");
const Spinner = require("../../controls/spinner");
const EncounterListForm = require("../form/encounter-list-form");


module.exports = class EncounterListPanel extends CollapsePanel {
    constructor (options={}) {
        super(options);
        /* Options
         *  encounter_types = 
         */

        this.spinner = new Spinner()

        this.btnEdit = new Button(
            'Add',
            (event) => {
                this._onEdit()
            },
            {
                icon: 'plus',
                style: 'clear'
            }
        )

        this.btnCancel = new Button(
            'Cancel',
            (event) => {
                this._onCancel()
            },
            {
                icon: 'x',
                style: 'clear'
            }
        )

        this._encountersList = new EncounterListForm({
            encounter_types: options.encounter_types
        })
    }

    _onEdit() {
        this.unlock()
    }

    _onCancel() {
        this.lock()
    }

    transient() {
        //this.btnAdd.hide()
        this.btnCancel.hide()
        this.btnEdit.hide()
    }

    lock() {
        this._encountersList.lock()
        this.btnEdit.show()
        this.btnCancel.hide()
    }

    unlock() {
        this._encountersList.unlock()
        this.btnEdit.hide()
        this.btnCancel.show()
    }

    setValue(value) {
        this.lock()

        if (value ? value['encounters_url'] : true) {
            this.setEncountersUrl(
                value['encounters_url'] + '?' + querystring.stringify({
                    'type': this.options.encounter_types.join(',')
                })
            )
            return
        }

        if (value ? !value['encounters'] : false) {
            return
        }

        this._encountersList.setValue(value['encounters'])
    }

    value() {
        return this._encountersList.value()
    }

    
    setEncountersUrl(url) {
        this.encountersUrl = url
        this.spinner.show()

        connection.get(
            this.encountersUrl,
            (response) => {
                this._encountersList.setValue({
                    'encounters': response.items,
                    'encounters_url': url
                })
                //TODO: Manage Pagination Here
            },
            (error) => {
                this._encountersList.setValue({
                    'encounters': [],
                    'encounters_url': url
                })
                if (error.status == 404) {
                    return
                }
                this.statusElem.innerHTML = "Error Loading Encounters"
            },
            () => {
                this.spinner.hide()
            }
        )
    }

    createElement() {
        super.createElement()

        this.element.classList.add('resource-panel')

        this.toolBarElement = document.createElement('div');
        this.toolBarElement.className = 'toolbar'
        this.headerElement.appendChild(this.toolBarElement)

        this.toolBarElement.appendChild(this.btnEdit.createElement())
        this.toolBarElement.appendChild(this.btnCancel.createElement())

        this.statusElem = document.createElement('div')
        this.statusElem.className = 'resource-status'

        this.toolBarElement.prepend(this.statusElem)

        this.bodyElement.appendChild(this.spinner.createElement())

        this.bodyElement.appendChild(this._encountersList.createElement())

        this._encountersList.lock()
        this.btnEdit.show()
        this.btnCancel.hide()
        this.spinner.hideSoft()

        return this.element
    }

}