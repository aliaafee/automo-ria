
const Control = require("../control");

class Field extends Control {
    constructor(name, label, options) {
        /*Options
         *  labelSize=in css units
         *  required=true|false
         *  invalidFeedback=""
         *  helpText=""
         *  placeholder=""
         */
        super(options);
        this.name = name;
        this.label = label;

        this._labelElement = null;
        this._placeholderElement = null;
        this._helpElement = null;
        this._invalidElement = null;
    }

    value() {
        return;
    }

    setValue(value) {
        return;
    }

    setData(data) {
        //Expects a dictionary with key equal to name
        this.setValue(
            data[this.name]
        );
    }

    isBlank() {
        return false;
    }

    isValid() {
        if (this.options.required == true) {
            if (this.isBlank()) {
                return false;
            }
        }
        return true;
    }

    validate() {
        this.markValid();

        var isValid = this.isValid();
        if (!isValid) {
            this.markInvalid();
        }

        return isValid;
    }

    markInvalid() {
        this.element.classList.add('invalid');
    }

    markValid() {
        this.element.classList.remove('invalid');
    }

    lock() {
        return;
    }

    unlock() {
        return;
    }

    createElement() {
        super.createElement()

        this.element.classList.add('field');

        this._labelElement = document.createElement('label');
        this._labelElement.innerHTML = this.label;
        this.element.appendChild(this._labelElement);

        var content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        this.element.appendChild(content);

        this._labelElement.style.width = this.options.labelSize;
        content.style.flexGrow = 1;

        this._placeholderElement = document.createElement('div');
        this._placeholderElement.style.display = 'flex';
        this._placeholderElement.style.flexGrow = 1;
        content.appendChild(this._placeholderElement);

        if (this.options.helpText != null) {
            this._helpElement = document.createElement('div');
            this._helpElement.className = 'help-text';
            this._helpElement.innerHTML = this.options.helpText;
            content.appendChild(this._helpElement);
        }

        if (this.options.invalidFeedback != null) {
            this._invalidElement = document.createElement('div');
            this._invalidElement.className = 'invalid-feedback';
            this._invalidElement.innerHTML = this.options.invalidFeedback;
            content.appendChild(this._invalidElement);
        }
        
        return this.element
    }
}

module.exports = Field;
