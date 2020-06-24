const Field = require("../../controls/form/field")
const Button = require("../../controls/button")

module.exports = class ProblemsField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this._data = [];

        this.btnAddProblem = new Button(
            'Add',
            (event) => {
                icd10Coder.show(
                    (value) => {
                        this._data.push(value)
                        console.log(value)
                        this.displayData()
                    },
                    () => {
                        console.log('Cancelled');
                    }
                )
            }
        )
    }

    _clearDisplay() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }
    }

    displayData() {
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
        this.displayData();
    }

    lock() {
        super.lock()
        this.btnAddProblem.hide()
    }

    unlock() {
        super.lock()
        this.btnAddProblem.show()
    }

    createElement() {
        super.createElement();

        this._listElement = document.createElement('ol');
        this._placeholderElement.appendChild(this._listElement);

        this._placeholderElement.appendChild(this.btnAddProblem.createElement())

        return this.element;
    }
}