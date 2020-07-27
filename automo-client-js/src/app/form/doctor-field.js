const Field = require("../../controls/form/field")
const ResourceSearchBox = require("../../controls/resource-search-box")

module.exports = class DoctorField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this._searchBox = new ResourceSearchBox(
            (item) => {
                return item.id
            },
            (item) => {
                return document.createTextNode(item.name)
            },
            (item) => {
                this._value = item
            },
            {
                placeholder: this.options.placeholder,
                displaySelected: true,
                displayNull: true,
                resourceName: 'personnel.doctors',
                popupHeight: '150px'
            }
        )
    }

    isBlank() {
        if (this.value() == null) {
            return true
        }
        return false
    }

    value() {
        super.value();
        return this._searchBox.value()
    }

    setValue(data) {
        super.setValue(data);
        this._data = data;
        this._searchBox.setValue(data);
    }

    setResourceUrl(url) {
        this._searchBox.setResourceUrl(url)
    }

    lock() {
        super.lock()
        this._searchBox.lock()
    }

    unlock() {
        super.unlock()
        this._searchBox.unlock()
    }

    createFieldBody() {
        let body = super.createFieldBody();

        body.appendChild(this._searchBox.createElement())


        return body;
    }
}