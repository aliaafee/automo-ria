const Form = require('../../controls/form/form');
const TextField = require('../../controls/form/text-field');
const FormDialog = require('../../controls/dialog/form-dialog');
const Spinner = require('../../controls/spinner');


class LoginDialog extends FormDialog {
    constructor(options={}) {
        var form = new Form();

        form.addField(new TextField(
            'index_url',
            {
                placeholder: 'Server URL',
                required: true
            }
        ));
        
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
                title: 'Login',
                okLabel: 'Login',
                width: '400px'
            }
        );

        this.spinner = new Spinner();

        this.statusElement = null;
    }


    _onOk(ev) {
        if (this.form.validate() == false) {
            return;
        }
        this.onOk(this.value());
    }


    tryLogin(connection, onSuccess, onCancel) {
        this.show(
            (data) => {
                this.spinner.show();
                connection.login(
                    data.index_url, data.username, data.password,
                    () => {
                        this.hide();
                        this.spinner.hide();
                        onSuccess();
                    },
                    (error) => {
                        this.statusElement.innerHTML = error.message;
                        this.spinner.hide();
                        this.form._fields[0].focus();
                    }
                )
            },
            () => {
                onCancel();
            }
        )
    }


    createElement() {
        super.createElement();

        this.headerElement.appendChild(this.spinner.createElement());
        this.spinner.hide();

        this.statusElement = document.createElement('div');
        this.statusElement.className = 'dialog-status';
        this.bodyElement.appendChild(this.statusElement);

        this.btnCancel.hide();
        this._closeElement.style.display = 'none';

        return this.element;
    }
}

module.exports = LoginDialog;