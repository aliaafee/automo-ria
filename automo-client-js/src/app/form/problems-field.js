const Field = require("../../controls/form/field")
const Button = require("../../controls/button");
const { lang } = require("moment");

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
                        this.displayData()
                    },
                    () => {
                        console.log('Cancelled');
                    }
                )
            },
            {
                icon: 'plus',
                style: 'clear'
            }
        )
    }

    _clearDisplay() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }
    }

    _getProblemLabel(problem) {
        let label = document.createElement('div')
        label.className = "category-label"

        let code = document.createElement('div')
        code.className = 'code'
        label.appendChild(code)

        let text = document.createElement('div')
        text.className = 'text'
        label.appendChild(text)

        if (problem.icd10class) {
            code.innerText = problem.icd10class.code
            code.setAttribute('code', problem.icd10class.code)

            text.append(
                ...[
                    ['preferred_plain', 'preferred-plain'],
                    ['preferred_long', 'preferred-long'],
                ].map(([key, className]) => {
                    if (problem.icd10class[key]) {
                        let elem = document.createElement('div')
                        elem.innerText = problem.icd10class[key]
                        elem.className = className
                        return elem
                    }
                }).filter(v => v)
            )

            text.append(
                ...[
                    ['icd10modifier_class', 'modifier'],
                    ['icd10modifier_extra_class', 'modifier-extra']
                ].map(([key, className]) => {
                    if (problem[key]) {
                        let elem = document.createElement('div')
                        elem.innerText = `${problem[key].code_short} - ${problem[key].preferred}`
                        elem.className = className
                        return elem
                    }
                }).filter(v => v)
            )
        } else {
            code.innerText = 'UNCODED'
        }

        if (problem.comment) {
            let elem = document.createElement('div')
            elem.className = 'comment'
            elem.innerText = problem.comment
            text.appendChild(elem)
        }

        return label
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

            elem.appendChild(this._getProblemLabel(item))

            var deleteButton = new Button(
                'Delete', 
                (event) => {
                    this._deleteItem(
                        event.currentTarget.getAttribute('item-index')
                    )
                },
                {
                    icon: 'trash',
                    style: 'clear',
                    className: 'alert'
                }
            )
            elem.appendChild(deleteButton.createElement())
            deleteButton.element.setAttribute('item-index', i)
        }
    }

    _deleteItem(itemIndex) {
        if (this._data == null) {
            return
        }

        this._date = this._data.splice(itemIndex, 1)

        this.displayData()
    }

    value() {
        super.value();
        return this._data;
    }

    isBlank() {
        if (this.value()) {
            return false
        }
        return true
    }

    setValue(data) {
        if (data) {
            if (data.length == 0) {
                super.setValue(null);
            } else {
                super.setValue(data)
            }
        } else {
            super.setValue(null)
        }

        this._data = [];
        Object.assign(this._data, data);
        this.displayData();
    }

    lock() {
        super.lock()
        this.btnAddProblem.hide()
    }

    unlock() {
        super.unlock()
        this.btnAddProblem.show()
    }

    createFieldBody() {
        let body = super.createFieldBody();

        this._buttonsElement = document.createElement('div')
        this._buttonsElement.className = 'toolbar'
        body.appendChild(this._buttonsElement)

        this._buttonsElement.appendChild(this.btnAddProblem.createElement())

        this._listElement = document.createElement('ol');
        this._listElement.className = 'problems-list'
        body.appendChild(this._listElement);

        return body
    }

    createElement() {
        let elem = super.createElement();

        elem.classList.add('problems-field')

        return elem;
    }
}