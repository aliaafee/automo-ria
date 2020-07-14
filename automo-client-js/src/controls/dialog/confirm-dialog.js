const Dialog = require("./dialog");
const Button = require("../button");


module.exports = class ConfirmDialog extends Dialog {
    constructor(options={}) {
        options.noCloseButton = true
        options.centered = true
        super(options)

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Yes',
            (ev) => {
                this._onOk(ev);
                this.hide()
            },
            {
                width: '80px'
            }
        );

        this.btnCancel = new Button(
            options.cancelLabel != null ? options.cancelLabel : 'No',
            (ev) => {
                this._onCancel(ev);
            },
            {
                width: '80px'
            }
        );
    }

    show(title, message, onOk, onCancel) {
        super.show(onCancel)
        this._onOk = onOk

        this.setTitle(title)
        this.messageElement.innerHTML = message
    }

    createElement() {
        super.createElement()

        this.element.className = 'foreground-centered-small'

        this.footerElement.appendChild(this.btnOk.createElement())
        this.footerElement.appendChild(this.btnCancel.createElement())

        this.messageElement = document.createElement('div')
        this.messageElement.className = 'message'
        this.bodyElement.appendChild(this.messageElement)

        return this.element
    
    }
}