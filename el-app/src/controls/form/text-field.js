const TextBox = require("../text-box");
const Field = require("./field");


class TextField extends Field {
    constructor(name, label, options = {}) {
        super(name, label, options);

        this._textBox = new TextBox({
            placeholder: options.placeholder,
            type: options.type
        });
    }

    isBlank() {
        return this._textBox.isBlank();
    }

    value() {
        return this._textBox.value();
    }

    setValue(value) {
        this._textBox.setValue(value);
    }

    lock() {
        this._textBox.lock();
    }

    unlock() {
        this._textBox.unlock();
    }

    createElement() {
        super.createElement()

        this._placeholderElement.appendChild(
            this._textBox.createElement()
        );

        this._textBox.element.style.flexGrow = 1;

        return this.element;
    }
}

module.exports = TextField;