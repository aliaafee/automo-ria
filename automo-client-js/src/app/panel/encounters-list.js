const Button = require("../../controls/button");
const querystring = require('querystring');
const Spinner = require("../../controls/spinner");
const CollapsePanel = require("../../controls/panel/collapse-panel");
//const ResourcePanel = require("../../controls/panel/resource-panel")
const EncounterPanel = require("./encounter-panel")
const EncounterForms = require("../form/encounter-forms")
const TypePickerDialog = require("../dialog/type-picker-dialog");
const { type } = require("os");

module.exports = class EncountersList extends CollapsePanel {
    constructor (options={}) {
        super(options);
        /* Options
         *  encounters_type= investigations | procedures | vitalsigns
         *  encounter_types = 
         */

        this.spinner = new Spinner()

        this.encounters_data = null

        this.btnEdit = new Button(
            'Edit',
            (event) => {
                this._onEdit()
            },
            {
                icon: 'edit-3',
                style: 'clear'
            }
        )
        /*
        this.btnAdd = new Button(
            'Add',
            (event) => {
                this._onAdd()
            },
            {
                icon: 'plus',
                style: 'clear'
            }
        )*/

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

        this._panels = []
    }

    _onEdit() {
        this.unlock()
    }

    _onCancel() {
        this.lock()
    }

    /*
    _onAdd() {
        console.log("Add")

        
    
    }*/

    transient() {
        //this.btnAdd.hide()
        this.btnCancel.hide()
        this.btnEdit.hide()
    }

    lock() {
        this.btnEdit.show()
        //this.btnAdd.hide()
        this.btnCancel.hide()
        if (this.encounterTypesElement) {
            this.encounterTypesElement.style.display = "none"
        }
    }

    unlock() {
        this.btnEdit.hide()
        //this.btnAdd.show()
        this.btnCancel.show()
        if (!this.encounterTypesElement) {
            this._createEncounterTypes()
        }
        this.encounterTypesElement.style.display = ""
    }

    setValue(value) {
        this.lock();

        if (value ? value['encounters_url'] : true) {
            this.setEncounterListUrl(
                value['encounters_url'] + '?' + querystring.stringify({
                    'type': this.options.encounter_types.join(',')
                })
            )
            return
        }

        if (value ? !value['encounters'] : false) {
            console.log("No encounters")
            return
        }

        console.log(value['encounters'])
    }

    value() {
        result = {
            'encounters': []
        }

        this._panels.forEach((panel) => {
            result['encounters'].push(panel.value())
        })

        return result
    }

    _createEncounterTypes() {
        this.encounterTypesElement = document.createElement('div')
        this.encounterTypesElement.classList.add('encounter-types')
        this.encounterTypesElement.classList.add('toolbar')
        this.bodyElement.prepend(this.encounterTypesElement)

        const encounter_types = this.options.encounter_types.map(
            (type_name, i) => {
                const form = new EncounterForms[type_name]()
                return {
                    name: type_name,
                    label: form.options.title
                };
            }
        )

        this.encounterTypesElement.append(
            ...encounter_types.map(
                ({name, label}) => {
                    let btn = new Button(
                        label,
                        () => {
                            this._addNewEncounter(name)
                        },
                        {
                            icon: 'plus',
                            style: 'clear'
                        }
                    )
                    return btn.createElement();
                }
            )
        )

    }

    _addNewEncounter(encounter_type) {
        let newPanel = new EncounterPanel(
            () => {},
            {
                type: encounter_type,
                newUrl: this.encountersUrl
            }
        )

        this.encountersListElement.prepend(newPanel.createElement())

        newPanel.unlock()
    }

    _clear() {
        while (this.encountersListElement.firstChild) {
            this.encountersListElement.firstChild.remove();
        }
        this._panels = []
    }

    _appendData(data) {
        if (data == null) {
            return
        }

        data.forEach((item) => {
            console.log(item.type)

            var panel = new EncounterPanel(
                () => {},
                {
                    type: item.type
                }
            )

            this.encountersListElement.appendChild(panel.createElement())

            panel.setValue(item)

            this._panels.push(panel)
        })
    }

    setEncounterListUrl(url) {
        this._clear()

        this.encountersUrl = url
        this.spinner.show()

        connection.get(
            this.encountersUrl,
            (response) => {
                console.log(response)
                this._appendData(response.items)
            },
            (error) => {
                if (error.status == 404) {
                    console.log("No encounters found")
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
        //this.toolBarElement.appendChild(this.btnAdd.createElement())
        this.toolBarElement.appendChild(this.btnCancel.createElement())

        this.statusElem = document.createElement('div')
        this.statusElem.className = 'resource-status'

        this.toolBarElement.prepend(this.statusElem)

        /*
        this.encounterTypesElement = document.createElement('div')
        this.encounterTypesElement.className = 'encounter-types'
        this.bodyElement.appendChild(this.encounterTypesElement)*/

        this.bodyElement.appendChild(this.spinner.createElement())

        this.encountersListElement = document.createElement('div')
        this.encountersListElement.className = 'encounters-list'
        this.bodyElement.appendChild(this.encountersListElement)

        this.btnEdit.show()
        //this.btnAdd.hide()
        this.btnCancel.hide()
        this.spinner.hideSoft()
        //this.encounterTypesElement.style.display = 'none'

        return this.element
    }
}