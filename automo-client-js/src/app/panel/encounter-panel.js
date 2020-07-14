const ResourcePanel = require("../../controls/panel/resource-panel")
const EncounterForms = require("../form/encounter-forms")


module.exports = class EncounterPanel extends ResourcePanel {
    constructor (onSaved, options={}) {
        var EncounterClass = EncounterForms[options.type]

        if (EncounterClass) {
            var form = new EncounterClass()
        } else {
            var form = new EncounterForms.encounter()
        }
        
    
        super(form, onSaved ,options);
    }
}