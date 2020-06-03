const Field = require("../../controls/form/field")

module.exports = class ProblemsField extends Field {
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

            var label = `${item.icd10class.code} - ${item.icd10class.preferred}`

            if (item.icd10modifier_class != null) {
                label += `, ${item.icd10modifier_class.code_short} - ${item.icd10modifier_class.preferred}`
            }

            if (item.icd10modifier_extra_class != null) {
                label += `, ${item.icd10modifier_extra_class.code_short} - ${item.icd10modifier_extra_class.preferred}`
            }

            if (item.comment != null) {
                label += `, ${item.comment}`
            }

            elem.innerHTML = label
        })
    }

    value() {
        super.value();
        return this._data;
    }

    setValue(data) {
        super.setValue(data);

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