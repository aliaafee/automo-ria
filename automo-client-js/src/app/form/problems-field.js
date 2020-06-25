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

    _getProblemLabel(problem) {
        var category = problem.icd10class
        var preferred_long = ""
        if (category.preferred_long != null) {
            preferred_long = `<div class="preferred-long">(${category.preferred_long})</div>`
        }

        var modifier = ""
        if (problem.icd10modifier_class != null) {
            modifier = `<div class="modifier">${problem.icd10modifier_class.code_short} - ${problem.icd10modifier_class.preferred}</div>`
        }

        var modifier_extra = ""
        if (problem.icd10modifier_extra_class != null) {
            modifier_extra = `<div class="modifier-extra">${problem.icd10modifier_extra_class.code_short} - ${problem.icd10modifier_extra_class.preferred}</div>`
        }

        var comment = ""
        if (problem.comment != null) {
            comment = `<div class="comment">${problem.comment}</div>`
        }

        return `
            <div class="category-label">
                <div class="code" code="${category.code}">
                    ${category.code}
                </div>
                <div class="text">
                    <div class="preferred">
                        ${category.preferred_plain}
                    </div>
                    ${preferred_long}
                    ${modifier}
                    ${modifier_extra}
                    ${comment}
                </div>
            </div>
        `
    }

    displayData() {
        this._clearDisplay();

        if (this._data == [] || this._data == null) {
            return
        }

        for (var i = 0; i < this._data.length; i++) {
            var item = this._data[i]
            var elem = document.createElement('li');
            this._listElement.appendChild(elem);

            elem.innerHTML = this._getProblemLabel(item)

            var deleteElem = document.createElement('button')
            deleteElem.innerHTML = 'Delete'
            deleteElem.setAttribute('item-index', i)
            deleteElem.addEventListener('click', (event) => {
                this._deleteItem(
                    event.currentTarget.getAttribute('item-index')
                )
            })

            elem.appendChild(deleteElem)
        }
    }

    _deleteItem(itemIndex) {
        if (this._data == null) {
            return
        }

        console.log(itemIndex)
        console.log(this._data)
        this._date = this._data.splice(itemIndex, 1)
        console.log(this._data)

        this.displayData()
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

        this.element.classList.add('problems-field')

        this._listElement = document.createElement('ol');
        this._listElement.className = 'problems-list'
        this._placeholderElement.appendChild(this._listElement);
        this._placeholderElement.style.flexDirection = 'column';

        this._buttonsElement = document.createElement('div')
        this._buttonsElement.className = 'field-buttons'
        this._placeholderElement.appendChild(this._buttonsElement)
        this._buttonsElement.appendChild(this.btnAddProblem.createElement())

        return this.element;
    }
}