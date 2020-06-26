
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

    markInvalid(message) {
        this.element.classList.add('invalid');
        if (message) {
            if (!this._invalidElement) {
                this._createInvalidElement(message)
            } else {
                this._invalidElement.innerHTML = message
            }
        }
    }

    markValid() {
        this.element.classList.remove('invalid');
    }

    lock() {
        this._locked = true;
        if (this.value() == null) {
            this.element.style.display = 'none';
        }
        this.element.classList.add('locked')
    }

    unlock() {
        this._locked = false;
        this.element.style.display = 'flex';
        this.element.classList.remove('locked')
    }

    _createInvalidElement(message) {
        var displayMessage = ""
        if (message) {
            displayMessage += message
        }
        if (this.options.invalidFeedback) {
            displayMessage += this.options.invalidFeedback
        }

        this._invalidElement = document.createElement('div');
        this._invalidElement.className = 'invalid-feedback';
        this._invalidElement.innerHTML = displayMessage;
        this._content.appendChild(this._invalidElement);
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
        
        this._content = document.createElement('div');
        this._content.style.display = 'flex';
        this._content.style.flexDirection = 'column';
        this._content.style.flexGrow = 1;
        //this.element.appendChild(content);

        if (this.options.label == null) {
            this.element.appendChild(this._content);
        } else if (this.options.labelTop == true) {
            this._content.appendChild(this._labelElement);
            this.element.appendChild(this._content);
        } else {
            this.element.appendChild(this._labelElement);
            this.element.appendChild(this._content);
        }

        this._placeholderElement = document.createElement('div');
        this._placeholderElement.className = "field-input-placeholder"
        this._placeholderElement.style.display = 'flex';
        this._placeholderElement.style.flexGrow = 1;
        this._content.appendChild(this._placeholderElement);

        if (this.options.helpText != null) {
            this._helpElement = document.createElement('div');
            this._helpElement.className = 'help-text';
            this._helpElement.innerHTML = this.options.helpText;
            this._content.appendChild(this._helpElement);
        }

        if (this.options.invalidFeedback != null) {
            this._createInvalidElement()
        }
        
        return this.element
    }
}
