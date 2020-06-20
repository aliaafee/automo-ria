const TextBox = require("../text-box");
const Field = require("./field");


module.exports = class TextField extends Field {
    constructor(name, options = {}) {
        super(name, options);

        this._textBox = new TextBox({
            placeholder: options.placeholder,
            type: options.type,
            rows: options.rows,
            resize: options.resize,
            grow: options.grow,
            maxGrow: options.maxGrow
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

    displayValue() {
        return this.value();
    }

    setValue(value) {
        super.setValue(value);
        this._textBox.setValue(value);
        if (this._lockedView.style.display != 'none') {
            this._lockedView.innerHTML = this.displayValue();
        }
    }

    lock() {
        super.lock();
        //this._textBox.lock();
        this._textBox.element.style.display = 'none';
        this._lockedView.style.display = 'flex';
        this._lockedView.innerHTML = this.displayValue();
    }

    unlock() {
        super.unlock();
        //this._textBox.unlock();
        this._textBox.element.style.display = 'flex';
        this._lockedView.style.display = 'none';
    }

    createElement() {
        super.createElement()

        this._placeholderElement.appendChild(
            this._textBox.createElement()
        );

        this._lockedView = document.createElement('div');
        this._lockedView.className = 'locked-text-box';
        this._lockedView.style.display = 'none';
        this._placeholderElement.appendChild(this._lockedView)

        this._textBox.element.style.flexGrow = 1;

        return this.element;
    }
}
