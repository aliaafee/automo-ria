const Control = require('./base-control');


class TextField extends Control {
    constructor(elementId, name, options={}) {
        /* Supported options, label, placeholder, helpText,
         * invalidFeedback, required, password, default
         * sideLabel={true|false}
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
        var ctrl_html = this.getControlHtml();

        var label = ""
        if (this.options.label) {
            var labelClass = this.options.sideLabel == true ? "col-sm-1 col-form-label" : ""
            label = `<label for="${this.elementId}" class="${labelClass}">${this.options.label}</label>`
        }
        
        var helpText = ""
        if (this.options.helpText) {
            helpText = `<small id="${this.elementId}-help-text" class="form-text text-muted">${this.options.helpText}</small>`
        }

        var invalidFeedback = ""
        if (this.options.invalidFeedback) {
            invalidFeedback = `<div class="invalid-feedback">${this.options.invalidFeedback}</div>`
        }

        if (this.options.sideLabel == true && this.options.label != null) {   
            return `
                <div class="form-group row">
                    ${label}
                    <div class="col-sm-11">
                        ${ctrl_html}
                        ${helpText}
                        ${invalidFeedback}
                    </div>
                </div>`
        }

        return `
            <div class="form-group">
                ${label}
                ${ctrl_html}
                ${helpText}
                ${invalidFeedback}
            </div>`
            
    }
}

module.exports = TextField;