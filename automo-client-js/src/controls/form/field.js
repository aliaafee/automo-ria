
const Control = require("../control");

module.exports = class Field extends Control {
    constructor(name, options = {}) {
        /*Options
         *  label=""
         *  labelSize=in css units
         *  labelTop=false
         *  required=true|false
         *  invalidFeedback=""
         *  helpText=""
         *  placeholder=""
         */
        super(options);
        this.name = name;
        //this.label = label;

        this._labelElement = null;
        this._placeholderElement = null;
        this._helpElement = null;
        this._invalidElement = null;

        this._locked = false;
    }

    value() {
        return;
    }

    setValue(value) {
        if (this._locked) {
            if (!value) {
                this.element.style.display = 'none';
                return
            }
            this.element.style.display = 'flex';
        }
    }

    setLabel(text) {
        if (this._labelElement != null) {
            this._labelElement.innerText = text;
        }
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
        this._locked = true;
        if (this.value() == null) {
            this.element.style.display = 'none';
        }
    }

    unlock() {
        this._locked = false;
        this.element.style.display = 'flex';
    }

    createElement() {
        super.createElement()

        this.element.classList.add('field');

        if (this.options.label != null) {
            var label = this.options.label
            if (this.options.required == true) {
                label += " *"
            }
            this._labelElement = document.createElement('label');
            this._labelElement.innerHTML = label;
            this._labelElement.style.width = this.options.labelSize;
            //this.element.appendChild(this._labelElement);
        }
        
        var content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.flexGrow = 1;
        //this.element.appendChild(content);

        if (this.options.label == null) {
            this.element.appendChild(content);
        } else if (this.options.labelTop == true) {
            content.appendChild(this._labelElement);
            this.element.appendChild(content);
        } else {
            this.element.appendChild(this._labelElement);
            this.element.appendChild(content);
        }

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
