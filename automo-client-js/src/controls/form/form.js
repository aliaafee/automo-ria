const Control = require("../control");


module.exports = class Form extends Control {
    constructor(options={}) {
        /*Options
         *  labelSize=in css units
         *  labelTop=false
         *  flexDirection='column|row'
         *  title='Heading title'
         *  compact=false
         */
        super(options);

        this._fields = [];
        this._fieldNames = [];
    }

    addField(field) {
        if (this.options.labelSize != null) {
            field.options.labelSize = this.options.labelSize;
        }
        if (this.options.labelTop != null) {
            field.options.labelTop = this.options.labelTop;
        }

        this._fields.push(field);
        this._fieldNames.push(field.name);
    }

    setValue(value) {
        //Value is dictionary with fieldName: value
        for (var i = 0; i < this._fieldNames.length; i++) {
            this._fields[i].setValue(
                value[this._fieldNames[i]]
            );
        }
    }

    value() {
        //Returns a dictionary with fieldName: value
        var result = {};
        for (var i = 0; i < this._fieldNames.length; i++) {
            result[this._fieldNames[i]] = this._fields[i].value();
        }
        return result;
    }

    isBlank() {
        var blank = true;
        for (var i = 0; i < this._fieldNames.length; i++) {
            if (!this._fields[i].isBlank()) {
                blank = false
                return blank
            }
        }
        return blank;
    }

    getFieldByName(fieldName) {
        return this._fields[this._fieldNames.findIndex((value) => { return value == fieldName;})];
    }

    setFieldLabel(fieldName, label) {
        this.getFieldByName(fieldName).setLabel(label);
    }

    setFieldValue(fieldName, value) {
        this.getFieldByName(fieldName).setValue(value);
    }

    fieldValue(fieldName) {
        return this.getFieldByName(fieldName).value();
    }

    hideField(fieldName) {
        this.getFieldByName(fieldName).hide();
    }

    isValid() {
        var isValid = true

        this._fields.forEach((field) => {
            if (field.isValid() == false) {
                isValid = false
                return isValid
            }
        });

        return isValid;
    }

    validate() {
        var isValid = true;

        this._fields.forEach((field) => {
            if (field.validate() == false) {
                isValid = false;
            }
        });

        return isValid;
    }

    lock() {
        this._fields.forEach((field) => {
            field.lock();
        });
    }

    unlock() {
        this._fields.forEach((field) => {
            field.unlock();
        });
    }

    clearValidation() {
        this._fields.forEach((field) => {
            field.markValid();
        });
    }

    createElement() {
        super.createElement();

        this.element.classList.add("form")

        if (this.options.compact) {
            this.element.classList.add("compact")
        }

        this.element.style.flexDirection = this.options.flexDirection ? this.options.flexDirection : 'column';

        if (this.options.title) {
            var title = document.createElement('h1')
            title.innerHTML = this.options.title
            this.element.appendChild(title)
        }


        this._fields.forEach((field) => {
            this.element.appendChild(field.createElement());
        })

        return this.element;
    }

}