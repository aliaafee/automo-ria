const ConfirmDialog = require("../../controls/dialog/confirm-dialog")
const { lang } = require("moment")

module.exports = class TypePickerDialog extends ConfirmDialog {
    constructor(options={}) {
        super({
            ...options, 
            okLabel: "Ok",
            cancelLabel: "Cancel"
        })
    }

    _clear() {
        while (this.listElement.firstChild) {
            this.listElement.firstChild.remove()
        }
    }

    _displayTypes(types) {
        types.forEach(({name, label}) => {
            const elem = document.createElement("li");
            elem.innerHTML = `
                <input type="radio" name="type" value="${name}">
                ${label}`
            this.listElement.appendChild(elem)
        })
    }

    show(title, message, types, onOk, onCancel) {
        super.show(
            title,
            message,
            () => {
                const val = this.formElement.elements
                console.log(this.formElement.elements)
                onOk(val)
            },
            onCancel
        );

        this._clear()
        this._displayTypes(types)
    }

    createElement() {
        super.createElement();

        this.formElement = document.createElement("form");
        this.formElement.name = "typePicker"
        this.bodyElement.appendChild(this.formElement);

        this.listElement = document.createElement("ul");
        this.bodyElement.appendChild(this.listElement)

        return this.element;
    }
}