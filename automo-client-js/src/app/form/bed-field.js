const TextField = require("../../controls/form/text-field")
const Field = require("../../controls/form/field")
const ResourceSearchBox = require("../../controls/resource-search-box")


module.exports = class BedField extends Field {
    constructor(name, options={}) {
        super(name, options);

        //this._value = null;
        this._value = null

        this._bedSearchBox = new ResourceSearchBox(
            (item) => {
                return item.id
            },
            (item) => {
                return `Bed ${item.number}`
            },
            (item) => {
                this._value = item
            },
            {
                placeholder: 'Bed',
                displaySelected: true,
                displayNull: true,
                popupHeight: '20%'
            }
        )


        this._wardSearchBox = new ResourceSearchBox(
            (item) =>  {
                return item.id
            },
            (item) => {
                return item.name
            },
            (item) => {
                this._bedSearchBox.setValue(null)
                if (item == null) {
                    this._bedSearchBox.lock()
                    return
                }
                this._bedSearchBox.unlock()
                this._bedSearchBox.setResourceUrl(item.url + "/beds/")
            },
            {
                placeholder: 'Ward',
                displaySelected: true,
                displayNull: true,
                resourceIndex: ['wards'],
                popupHeight: '20%'
            }
        )

    }

    isBlank() {
        if (this._value == null) {
            return true
        }
        return false
    }

    value() {
        return this._value;
    }

    setValue(value) {
        this._value = value;
        this._bedSearchBox.setValue(value);
        if (value == null) {
            this._wardSearchBox.setValue(null)
        } else {
            this._wardSearchBox.setValue(value.ward)
        }
        super.setValue(value)
    }

    lock() {
        super.lock()
        this._bedSearchBox.lock()
        this._wardSearchBox.lock()
    }

    unlock() {
        super.unlock()
        this._wardSearchBox.unlock()
        if (this._wardSearchBox.value() != null) {
            this._bedSearchBox.unlock()
        }
    }

    createElement() {
        super.createElement()

        //this._displayElement = document.createElement('div');
        //this._displayElement.className = 'locked-text-box';
        //this._placeholderElement.appendChild(this._displayElement);

        this._placeholderElement.classList.add('input-group-row')
        this._placeholderElement.appendChild(this._wardSearchBox.createElement())
        this._placeholderElement.appendChild(this._bedSearchBox.createElement())

        this._bedSearchBox.lock()

        return this.element
    }
}