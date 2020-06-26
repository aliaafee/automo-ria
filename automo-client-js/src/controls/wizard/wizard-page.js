const Control = require('../control')

module.exports = class WizardPage extends Control {
    constructor(options) {
        super(options)
    }

    validate() {
        return true
    }

    value() {
        return;
    }

    setValue(value) {

    }

    hide() {
        this.element.style.display = 'none'
    }

    show() {
        this.element.style.display = 'block'
    }

    createElement() {
        super.createElement()

        this.element.classList.add('wizard-page')
        this.element.classList.add('scrolled')
        //this.element.style.display = 'block'

        if (this.options.title) {
            var title = document.createElement('h1')
            title.innerHTML = this.options.title
            this.element.appendChild(title)
        }

        return this.element
    }
}