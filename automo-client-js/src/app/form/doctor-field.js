const Field = require("../../controls/form/field")
const ResourceSearchBox = require("../../controls/resource-search-box")

module.exports = class DoctorField extends Field {
    constructor(name, options={}) {
        super(name, options);

        this._value = null

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
                //resourceName: 'personnel.doctors',
                popupHeight: '150px'
            }
        )

        this._departmentSearchBox = new ResourceSearchBox(
            (item) =>  {
                return item.id
            },
            (item) => {
                return document.createTextNode(item.name)
            },
            (item) => {
                this._value = null
                this._searchBox.setValue(null)
                if (item == null) {
                    this._searchBox.lock()
                    return
                }
                this._searchBox.unlock()
                this._searchBox.setResourceUrl(item.url + "/personnel/")
            },
            {
                placeholder: 'Department',
                displaySelected: true,
                displayNull: true,
                //resourceName: 'wards',
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
                this._searchBox.setValue(null)
                if (item == null) {
                    this._departmentSearchBox.lock()
                    this._searchBox.lock()
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
        if (this.value() == null) {
            return true
        }
        return false
    }

    value() {
        super.value();
        return this._value
    }

    setValue(value) {
        this._value = value;
        this._searchBox.setValue(value)
        if (value == null) {
            this._hospitalSearchBox.setValue(null)
            this._departmentSearchBox.setValue(null)
            if (window.localSettings['hospital']) {
                this._hospitalSearchBox.hide()
                this._hospitalSearchBox.setValue(window.localSettings['hospital'])
                this._departmentSearchBox.setResourceUrl(window.localSettings['hospital']['url'] + "/departments/")
                this._departmentSearchBox.unlock()
            }
            if (window.localSettings['department']) {
                //this._departmentSearchBox.hide()
                this._departmentSearchBox.setValue(window.localSettings['department'])
                this._searchBox.setResourceUrl(window.localSettings['department']['url'] + "/personnel/")
                this._searchBox.unlock()
            }
        } else {
            this._hospitalSearchBox.setValue(value.department.hospital)
            this._departmentSearchBox.setResourceUrl(value.department.hospital.url + "/departments/")
            this._departmentSearchBox.setValue(value.department)
            this._searchBox.setResourceUrl(value.department.url + "/personnel/")

            if (value.department.hospital.id == window.localSettings['hospital']['id']) {
                this._hospitalSearchBox.hide()
            }

            //if (value.department.id == window.localSettings['department']['id']) {
            //    this._departmentSearchBox.hide()
            //}
        }
        super.setValue(value);
    }

    lock() {
        super.lock()
        this._searchBox.lock()
        this._hospitalSearchBox.lock()
        this._departmentSearchBox.lock()
    }

    unlock() {
        super.unlock()
        this._hospitalSearchBox.unlock()
        if (this._hospitalSearchBox.value() != null) {
            this._departmentSearchBox.unlock()
            if (this._departmentSearchBox.value() != null) {
                this._searchBox.unlock()
            }
        }
    }

    createFieldBody() {
        let body = super.createFieldBody();

        body.appendChild(this._hospitalSearchBox.createElement())
        body.appendChild(this._departmentSearchBox.createElement())
        body.appendChild(this._searchBox.createElement())


        return body;
    }
}