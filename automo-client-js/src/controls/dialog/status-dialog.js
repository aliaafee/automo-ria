const Dialog = require("./dialog");
const Button = require("../button");
const Spinner = require("../spinner")


module.exports = class StatusDialog extends Dialog {
    constructor(options={}) {
        options.noCloseButton = true
        options.centered = true
        super(options)

        this.btnOk = new Button(
            options.okLabel != null ? options.okLabel : 'Ok',
            (ev) => {
                this._onOk(ev);
            },
            {
                width: '80px'
            }
        );

        this._afterDismiss = null

        this.spinner = new Spinner()
    }

    setMessage(message) {
        this.messageElement.innerHTML = message
    }

    showSpinner() {
        this.spinner.show()
    }

    hideSpinner() {
        this.spinner.hideSoft()
    }

    showDismiss(afterDismiss) {
        this._afterDismiss = afterDismiss
        this.btnOk.show()
        this.hideSpinner()
    }

    _onOk() {
        if (this._afterDismiss) {
            this._afterDismiss()
        }
        this.hide()
    }

    maximize() {
        this.element.className = "foreground"
    }

    show(title, message, dissmissable=true) {
        super.show(() => {})

        this.setTitle(title)
        this.messageElement.innerHTML = message

        if (!dissmissable) {
            this.btnOk.hide()
        } else{
            this.hideSpinner()
        }
    }

    createElement() {
        super.createElement()

        this.element.className = 'foreground-centered-small'

        this.footerElement.appendChild(this.btnOk.createElement())

        this.bodyElement.appendChild(this.spinner.createElement())

        this.messageElement = document.createElement('div')
        this.messageElement.className = 'message'
        this.bodyElement.appendChild(this.messageElement)

        return this.element
    }
}