const EncounterForms = require("./encounter-forms")
const ListForm = require("../../controls/form/list-form")


module.exports = class EncounterListForm extends ListForm {
    constructor(options={}) {
        /* Options
         *  encounter_types = ['name', 'name']
         *
         */

        super(
            'encounters',
            (item) => {
                //console.log(item)
            },
            (items) => {
                //console.log(items)
            },
            options
        )
    }

    setValue(value) {
        if (value) {
            this.resourceUrl = value['encounters_url']
        }
        super.setValue(value)
    }

    getFormTypes() {
        return this.options.encounter_types.map(
            (type_name, i) => {
                const form = new EncounterForms[type_name]()
                return {
                    name: type_name,
                    label: form.options.title
                };
            }
        )
    }

    generateSubForm(typeName) {
        var EncounterClass = EncounterForms[typeName]

        if (EncounterClass) {
            return new EncounterClass()
        }
        
        return new EncounterForms.encounter()
    }
}