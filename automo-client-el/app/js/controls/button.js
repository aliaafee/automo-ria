const Control = require('./base-control');


class Button extends Control {
    constructor(elementId, name, label, onClick, options = {}) {
        /* Supported options, label
         * 
         */
        super(elementId);
        this.name = name;
        this.label = label;
        this.options = options;
        this.onClick = onClick;
    }

    setupEvents() {
        this.element().click(this.onClick)
    }

    getHtml() {
        return `
            <button id="${this.elementId}" name="${this.name}" class="btn btn-secondary">
                ${this.label}
            </button>`
    }
}

module.exports = Button