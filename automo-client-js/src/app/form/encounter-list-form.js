//const querystring = require('querystring');

const Form = require('../../controls/form/form')
const Button = require('../../controls/button')
const EncounterPanel = require("../panel/encounter-panel")
const EncounterForms = require("./encounter-forms")


module.exports = class EncounterListForm extends Form {
    constructor(options = {}) {
        super(options)
        /* Options
         *  encounter-types = 
         */
        /* This form has just one field with name encounters
         * setValue also excepts encouters_url if available
         * value return encounters field as list
         */

        this._panels = []
    }

    lock() {
        this.encounterTypesElement.style.display = "none"
    }

    lockAll() {
        this.lock()
        this._panels.forEach((panel) => {
            panel.lock()
        })
    }

    unlock() {
        this.encounterTypesElement.style.display = ""
    }

    unlockAll() {

    }

    setValue(value) {
        this._clear();

        if (!value) {
            return
        }

        this.encountersUrl = value['encounters_url']

        if (!value['encounters']) {
            return
        }

        this._appendData(value['encounters'])
    }

    value() {
        console.log(this._panels)
        return {
            'encounters': this._panels
                            .map((panel) => panel.value())
                            .filter((value) => value)
        }
    }

    validate() {
        return this._panels.map(
            (panel) => panel.validate()
        ).reduce(
            (prev, curr) => {
                if (!curr) {
                    return false
                }
                return prev
            },
            true
        )
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

            let panel = new EncounterPanel(
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

    _createEncounterTypes() {
        this.encounterTypesElement = document.createElement('div')
        this.encounterTypesElement.classList.add('encounter-types')
        this.encounterTypesElement.classList.add('toolbar')
        this.element.prepend(this.encounterTypesElement)

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
        this._panels.push(newPanel)

        newPanel.unlock()
    }

    createElement() {
        super.createElement()

        this.element.classList.add('encounter-list-form')

        this.encountersListElement = document.createElement('div')
        this.encountersListElement.className = 'encounters-list'
        this.element.appendChild(this.encountersListElement)

        this._createEncounterTypes()

        return this.element
    }

}