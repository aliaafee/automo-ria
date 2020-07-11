const FormDialog = require('../../controls/dialog/form-dialog');
const UserForm = require('../form/user-form');


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
    
    show(onOk, onCancel) {
        super.show(onOk, onCancel)

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
