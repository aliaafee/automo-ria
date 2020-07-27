const Field = require("../../controls/form/field")
const Button = require("../../controls/button")
const TextBox = require("../../controls/text-box")
const ResourceSearchBox = require("../../controls/resource-search-box")
const AutocompleteBox = require("../../controls/autocomplete-box")

module.exports = class PrescriptionField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this._data = [];

        this.txtDrug = new AutocompleteBox(
            (drug) => {
                return drug.id
            },
            (drug) => {
                return drug.name
            },
            (drug) => {
                console.log(drug)
            },
            {
                resourceName: 'drugs',
                placeholder: "Medication"
            }
        )

        this.txtOrder = new TextBox(
            {
                placeholder: "Instructions"
            }
        )
        
        this.btnAdd = new Button(
            'Add',
            (event) => {
                this._onAdd(event)
            },
            {
                icon:'plus'
            }
        )
    }

    _onAdd(event) {
        if (!this.txtDrug.value()) {
            this.txtDrug.focus()
            return
        }

        if (!this.txtOrder.value()) {
            this.txtOrder.focus()
            return
        }

        this._data.push({
            'drug': this.txtDrug.value(),
            'drug_order': this.txtOrder.value(),
            'active': true
        })
        this.txtDrug.setValue(null)
        this.txtOrder.setValue("")
        this.txtDrug.focus()
        this.displayData()
    }

    _clearDisplay() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }
    }

    _getItemLabel(item) {
        if (item.drug) {
            return `<div>${item.drug.name} ${item.drug_order}</div>`
        }
        if (item.drug_str) {
            return `<div>${item.drug_str} ${item.drug_order}</div>`
        }
        return `<div>${item.drug_order}</div>`
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
 
            elem.innerHTML = this._getItemLabel(item)

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
            /*
            var deleteElem = document.createElement('button')
            deleteElem.innerHTML = 'Delete'
            deleteElem.setAttribute('item-index', i)
            deleteElem.addEventListener('click', (event) => {
                this._deleteItem(
                    event.currentTarget.getAttribute('item-index')
                )
            })

            elem.appendChild(deleteElem)*/
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

        this._data = data;
        this.displayData();
    }

    lock() {
        super.lock()
    }

    unlock() {
        super.unlock()
    }

    createFieldBody() {
        let body = super.createFieldBody();

        this._toolbarElement = document.createElement('div')
        this._toolbarElement.className = 'toolbar'
        body.appendChild(this._toolbarElement)

        this._toolbarElement.appendChild(this.txtDrug.createElement())
        this._toolbarElement.appendChild(this.txtOrder.createElement())
        this._toolbarElement.appendChild(this.btnAdd.createElement())

        this._listElement = document.createElement('ol');
        body.appendChild(this._listElement);

        this.txtOrder.element.addEventListener("keyup", (event) => {
            if (event.code == "Enter") {
                this._onAdd()
            }
        })

        return body
    }


    createElement() {
        let elem = super.createElement();

        elem.classList.add('precription-field')

        return elem;
    }
}