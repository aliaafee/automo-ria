const Field = require("../../controls/form/field")

module.exports = class PrescriptionField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this._data = [];
    }

    _clearDisplay() {
        
    }

    _displayData() {
        this._clearDisplay();

        if (this._data == [] || this._data == null) {
            return
        }

        this._data.forEach((item) => {
            var elem = document.createElement('li');
            this._listElement.appendChild(elem);
            elem.innerHTML = `${item.drug.name} ${item.drug_order}`
        })
    }

    value() {
        super.value();
        return this._data;
    }

    setValue(data) {
        if (data) {
            if (data.length == 0) {
                super.setValue(null);
            } else {
                super.setValue(data)
            }
        } else {
            super.setValue(data)
        }
        

        this._data = data;
        this._displayData();
    }

    createElement() {
        super.createElement();

        this._listElement = document.createElement('ol');
        this._placeholderElement.appendChild(this._listElement);

        return this.element;
    }
}