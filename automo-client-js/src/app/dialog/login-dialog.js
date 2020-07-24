const Form = require('../../controls/form/form');
const TextField = require('../../controls/form/text-field');
const FormDialog = require('../../controls/dialog/form-dialog');
const Spinner = require('../../controls/spinner');
const Control = require('../../controls/control')


module.exports = class LoginDialog extends FormDialog {
    constructor(options={}) {
        var form = new Form();

        /*
        form.addField(new TextField(
            'index_url',
            {
                placeholder: 'Server URL',
                required: true
            }
        ));
        */
        
        form.addField(new TextField(
            'username',
            {
                placeholder: 'Username',
                required: true
            }
        ));
        
        form.addField(new TextField(
            'password',
            {
                placeholder: 'Password',
                type: 'password',
                required: true
            }
        ));

        super(
            form, 
            {
                title: 'AutoMO',
                okLabel: 'Login',
                okIcon: 'log-in',
                centered: true,
                noCloseButton: true
            }
        );

        this.spinner = new Spinner();
        this.status = new Control(
            {
                className: 'dialog-status'
            }
        );
    }


    _onOk(ev) {
        if (this.form.validate() == false) {
            return;
        }
        this.onOk(this.value());
    }


    tryLogin(onSuccess, onCancel) {
        this.show(
            (data) => {
                this.spinner.show();
                connection.login(
                    '/api/', data.username, data.password,
                    () => {
                        this.hide();
                        onSuccess();
                    },
                    (error) => {
                        this.status.setValue(error.message)
                        this.form._fields[1].focus();
                    },
                    () => {
                        this.spinner.hideSoft();
                    }
                )
            },
            () => {
                onCancel();
            }
        )
    }

    createBodyElement() {
        let body = super.createBodyElement()

        body.className = 'dialog-body';
        body.prepend(this.spinner.createElement())
        body.append(this.status.createElement())

        this.spinner.hide()

        return body
    }

    createElement() {
        let elem = super.createElement();

        elem.id = 'login-dialog';

        return elem;
    }
}