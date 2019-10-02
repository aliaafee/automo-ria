const Control = require('./base-control');


class TextField extends Control {
    constructor(elementId, name, options={}) {
        /* Supported options, label, placeholder, helpText,
         * invalidFeedback, required, password, default
         */
        super(elementId);
        this.name = name;
        this.options = options;
    }

    isValid() {
        if (this.options.required == true) {
            if (this.val() == '') {
                return false
            }
        }
        return true;
    }

    validate() {
        this.markValid()

        var isValid = this.isValid();
        if (!isValid) {
            this.markInvalid();
        }

        return isValid;
    }

    markValid() {
        this.element().removeClass("is-invalid");
    }

    markInvalid() {
        this.element().addClass("is-invalid");
    }

    lock() {
        this.element().prop('readonly', true)
        this.element().removeClass('form-control')
        this.element().addClass('form-control-plaintext')
    }

    unlock() {
        this.element().prop('readonly', false)
        this.element().removeClass('form-control-plaintext')
        this.element().addClass('form-control')
    }

    getControlHtml() {
        return `<input 
            class="form-control" 
            id="${this.elementId}" 
            placeholder="${this.options.placeholder ? this.options.placeholder : ''}"
            ${this.options.password == true ? 'type="password"' : ''}
            ${this.options.default != null ? `value="${this.options.default}"` : ''}
        >`
    }

    getHtml() {
        var ctrl_html = "";
        
        if (this.options.label) {
            ctrl_html += `<label for="${this.elementId}">${this.options.label}</label>`
        }
        
        ctrl_html += this.getControlHtml();
        
        if (this.options.helpText) {
            ctrl_html += `<small id="${this.elementId}-help-text" class="form-text text-muted">${this.options.helpText}</small>`
        }

        if (this.options.invalidFeedback) {
            ctrl_html += `<div class="invalid-feedback">${this.options.invalidFeedback}</div>`
        }

        return `<div>${ctrl_html}</div>`
    }
}

module.exports = TextField;