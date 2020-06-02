const TextBox = require("../text-box");
const Field = require("./field");


module.exports = class TextField extends Field {
    constructor(name, options = {}) {
        super(name, options);

        this._textBox = new TextBox({
            placeholder: options.placeholder,
            type: options.type,
            rows: options.rows,
            resize: options.resize
        });
    }

    focus() {
        this._textBox.focus();
    }

    isBlank() {
        return this._textBox.isBlank();
    }

    value() {
        return this._textBox.value();
    }

    setValue(value) {
        super.setValue(value);
        this._textBox.setValue(value);
    }

    lock() {
        super.lock();
        this._textBox.lock();
    }

    unlock() {
        super.unlock();
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
