const TextBox = require("../text-box");
const Field = require("./field");


class TextField extends Field {
    constructor(name, label, options) {
        super(name, label, options);

        this._textBox = new TextBox ();
    }

    value() {
        return this._textBox.value();
    }

    setValue(value) {
        this._textBox.setValue(value);
    }

    createElement() {
        super.createElement()

        this._placeholderElement.appendChild(
            this._textBox.createElement()
        );

        this._textBox.element.style.flexGrow = 1;

        if (this.options.placeholder != null) {
            this._textBox.element.setAttribute('placeholder', this.options.placeholder);
        }

        return this.element;
    }
}

module.exports = TextField;