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
                return document.createTextNode(`Bed ${item.number}`)
            },
            (item) => {
                this._value = item
            },
            {
                placeholder: 'Bed',
                displaySelected: true,
                displayNull: true,
                popupHeight: '150px'
            }
        )


        this._wardSearchBox = new ResourceSearchBox(
            (item) =>  {
                return item.id
            },
            (item) => {
                return document.createTextNode(item.name)
            },
            (item) => {
                this._value = null
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
                resourceName: 'wards',
                popupHeight: '150px'
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
            this._bedSearchBox.setResourceUrl(value.ward.url + "/beds/")
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

    createFieldBody() {
        let body = super.createFieldBody();

        //this._displayElement = document.createElement('div');
        //this._displayElement.className = 'locked-text-box';
        //this._placeholderElement.appendChild(this._displayElement);

        body.classList.add('input-group-row')
        body.appendChild(this._wardSearchBox.createElement())
        body.appendChild(this._bedSearchBox.createElement())

        this._bedSearchBox.lock()

        return body
    }
}