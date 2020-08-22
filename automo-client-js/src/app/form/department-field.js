const Field = require("../../controls/form/field")
const ResourceSearchBox = require("../../controls/resource-search-box")


module.exports = class DepartmentField extends Field {
    constructor(name, options={}) {
        super(name, options);

        //this._value = null;
        this._value = null

        this._departmentSearchBox = new ResourceSearchBox(
            (item) => {
                return item.id
            },
            (item) => {
                return document.createTextNode(item.name)
            },
            (item) => {
                this._value = item
                this._value['hospital'] = this._hospitalSearchBox.value()
            },
            {
                placeholder: 'Department',
                displaySelected: true,
                displayNull: true,
                popupHeight: '150px'
            }
        )


        this._hospitalSearchBox = new ResourceSearchBox(
            (item) =>  {
                return item.id
            },
            (item) => {
                return document.createTextNode(item.name)
            },
            (item) => {
                this._value = null
                this._departmentSearchBox.setValue(null)
                if (item == null) {
                    this._departmentSearchBox.lock()
                    return
                }
                this._departmentSearchBox.unlock()
                this._departmentSearchBox.setResourceUrl(item.url + "/departments/")
            },
            {
                placeholder: 'Hospital',
                displaySelected: true,
                displayNull: true,
                resourceName: 'hospitals',
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
        this._departmentSearchBox.setValue(value);
        if (value == null) {
            this._hospitalSearchBox.setValue(null)
        } else {
            this._hospitalSearchBox.setValue(value.ward)
            this._departmentSearchBox.setResourceUrl(value.ward.url + "/departments/")
        }
        super.setValue(value)
    }

    lock() {
        super.lock()
        this._departmentSearchBox.lock()
        this._hospitalSearchBox.lock()
    }

    unlock() {
        super.unlock()
        this._hospitalSearchBox.unlock()
        if (this._hospitalSearchBox.value() != null) {
            this._departmentSearchBox.unlock()
        }
    }

    createFieldBody() {
        let body = super.createFieldBody();

        body.classList.add('input-group-row')
        body.appendChild(this._hospitalSearchBox.createElement())
        body.appendChild(this._departmentSearchBox.createElement())

        this._departmentSearchBox.lock()

        return body
    }
}