const FormDialog = require('../../controls/dialog/form-dialog');
const LocalSettingsForm = require('../form/local-settings-form');
const StatusDialog = require("../../controls/dialog/status-dialog")


module.exports = class InitialLocalSettingsDialog extends FormDialog {
    constructor(options={}) {
        super(
            new LocalSettingsForm(), 
            {
                title: 'Settings',
                okLabel: 'Save',
                ...options
            }
        );
    }

    _onSave(afterSave) {
        var form_data = this.value()

        var data = {
            'hospital': form_data['department']['hospital'],
            'department': form_data['department']
        }

        saveSettings(data)

        afterSave(data)
    }
    
    show(afterSave, onCancel) {
        super.show(
            () => {
                this._onSave(afterSave)
            }, 
            onCancel
        )
    }
}