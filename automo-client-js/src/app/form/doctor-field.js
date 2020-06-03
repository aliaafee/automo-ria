const Field = require("../../controls/form/field")

module.exports = class DoctorField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this._data = null;
    }

    _displayData() {
        this._displayElement.innerHTML = this._data.name;
    }

    value() {
        super.value();
        return this._data
    }

    setValue(data) {
        super.setValue(data);

        this._data = data;
        this._displayData();
    }

    createElement() {
        super.createElement();

        this._displayElement = document.createElement('div');
        this._displayElement.className = 'locked-text-box';
        this._placeholderElement.appendChild(this._displayElement);


        return this.element;
    }
}