const FormDialog = require('../../controls/dialog/form-dialog');
const UserForm = require('../form/user-form');
const StatusDialog = require("../../controls/dialog/status-dialog")


module.exports = class UserDialog extends FormDialog {
    constructor(options={}) {
        super(
            new UserForm(), 
            {
                title: 'User',
                okLabel: 'Save',
            }
        );
    }

    _onSave(afterSave) {
        var statusDialog = new StatusDialog()

        statusDialog.show(
            'Saving...',
            'Please Wait.',
            false
        )

        var form_data = this.value()

        var data = {
            'current_password': form_data['current_password'],
            'password': form_data['password']
        }

        connection.post(
            connection.user.url,
            data,
            (response) => {
                if (response.error) {
                    statusDialog.setTitle("Failed")
                    statusDialog.setMessage($response.error)
                    statusDialog.showDismiss()
                    return
                }

                statusDialog.setTitle("Success")
                statusDialog.setMessage(
                    `Successfully saved changes.`
                )
                statusDialog.showDismiss(
                    () => {
                        this.hide()
                        afterSave(data)
                    }
                )
            },
            (error) => {
                statusDialog.setTitle("Failed")
                statusDialog.showDismiss()
                if (error.status == 401) {
                    statusDialog.setMessage("Current Password is not valid.")
                    return
                }
                statusDialog.setMessage(
                    `An error occured while saving ${error}.`
                )
            }
        )
    }
    
    show(afterSave, onCancel) {
        super.show(
            () => {
                this._onSave(afterSave)
            }, 
            onCancel
        )

        var username = this.form.getFieldByName('username')
        username.setValue(connection.user.username)
        username.lock()

        var fullname = this.form.getFieldByName('fullname')
        fullname.setValue(connection.user.getName())
        fullname.lock()

        this.setTitle(
            `User - ${connection.user.getName()} (${connection.user.username})`
        )
    }
}
