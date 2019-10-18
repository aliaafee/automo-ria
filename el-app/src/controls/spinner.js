const Control = require("./control");

class Spinner extends Control {
    constructor(options) {
        super(options);

        this._spinnerElement = null;
        this._labelElement = null;
    }

    setLabel(label) {
        this._labelElement.innerHtml = label;
    }

    createElement() {
        super.createElement();

        this.element.className = 'spinner-container';

        this._spinnerElement = document.createElement('div');
        this._spinnerElement.className = 'spinner';
        this.element.appendChild(this._spinnerElement);

        this._labelElement = document.createElement('div');
        this._labelElement.className = 'spinner-label';
        this.element.appendChild(this._labelElement);

        return this.element;
    }
}

module.exports = Spinner;