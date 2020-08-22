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
                this._wardSearchBox.setValue(null)
                this._bedSearchBox.setValue(null)
                if (item == null) {
                    this._wardSearchBox.lock()
                    this._bedSearchBox.lock()
                    return
                }
                this._wardSearchBox.unlock()
                this._bedSearchBox.lock()
                this._wardSearchBox.setResourceUrl(item.url + "/wards/")
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
        this._bedSearchBox.setValue(value);
        if (value == null) {
            this._hospitalSearchBox.setValue(null)
            this._wardSearchBox.setValue(null)
            if (window.localSettings['hospital']) {
                this._hospitalSearchBox.hide()
                this._hospitalSearchBox.setValue(window.localSettings['hospital'])
                this._wardSearchBox.setResourceUrl(window.localSettings['hospital']['url'] + "/wards/")
            }
        } else {
            this._hospitalSearchBox.setValue(value.ward.hospital)
            this._wardSearchBox.setResourceUrl(value.ward.hospital.url + "/wards/")
            this._wardSearchBox.setValue(value.ward)
            this._bedSearchBox.setResourceUrl(value.ward.url + "/beds/")

            if (value.ward.hospital.id == window.localSettings['hospital']['id']) {
                this._hospitalSearchBox.hide()
            }
        }
        super.setValue(value)
    }

    lock() {
        super.lock()
        this._bedSearchBox.lock()
        this._wardSearchBox.lock()
        this._hospitalSearchBox.lock()
    }

    unlock() {
        super.unlock()
        this._hospitalSearchBox.unlock()
        if (this._hospitalSearchBox.value() != null) {
            this._wardSearchBox.unlock()
            if (this._wardSearchBox.value() != null) {
                this._bedSearchBox.unlock()
            }
        }
    }

    createFieldBody() {
        let body = super.createFieldBody();

        body.classList.add('input-group-row')
        body.appendChild(this._hospitalSearchBox.createElement())
        body.appendChild(this._wardSearchBox.createElement())
        body.appendChild(this._bedSearchBox.createElement())

        this._bedSearchBox.lock()
        this._wardSearchBox.lock()

        return body
    }
}