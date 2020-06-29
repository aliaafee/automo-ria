const Dialog = require("./dialog");
const Button = require("../button");


module.exports = class FormDialog extends Dialog {
    constructor(form, options={}) {
        super(options)

        this.form = form;

        this.onOk = null;

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Ok',
            (ev) => {
                this._onOk(ev);
            }
        );

        this.btnCancel = new Button(
            options.cancelLabel != null ? options.cancelLabel : 'Cancel',
            (ev) => {
                this._onCancel(ev);
            }
        )
    }

    value() {
        return this.form.value();
    }

    show(onOk, onCancel) {
        this.onOk = onOk
        super.show(onCancel)
    }

    _onOk(ev) {
        if (this.form.validate() == false) {
            return;
        }
        this.onOk()
        //super._onOk(ev);
    }

    createElement() {
        super.createElement();

        this.bodyElement.className = 'dialog-body-padded';
        this.bodyElement.appendChild(this.form.createElement());

        this.footerElement.appendChild(this.btnCancel.createElement());
        this.footerElement.appendChild(this.btnOk.createElement());

        return this.element;
    }

}