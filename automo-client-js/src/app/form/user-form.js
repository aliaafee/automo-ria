const Form = require('../../controls/form/form')
const TextField = require('../../controls/form/text-field')


module.exports = class UserForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(
            new TextField(
                'username',
                {
                    label: "User Name"
                }
            )
        )

        this.addField(
            new TextField(
                'fullname',
                {
                    label: "Full Name"
                }
            )
        )
        
        this.addField(
            new TextField(
                'current_password',
                {
                    label: "Current Password",
                    type: 'password',
                    required: true
                }
            )
        )

        this.addField(
            new TextField(
                'password',
                {
                    label: "New Password",
                    type: 'password',
                    required: true
                }
            )
        )
    }
}