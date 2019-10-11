const feather = require('feather-icons');

const Control = require('./base-control');


class Button extends Control {
    constructor(elementId, name, label, onClick, options = {}) {
        /* Supported options, label
         *  type=`primary|seconday|success|danger|warning|info|light|dark|link`
         *  icon={feather icon name}
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
        var btnClass = 'primary'
        if (this.options.type) {
            btnClass = this.options.type
        }
        var iconSvg = ""
        if (this.options.icon) {
            iconSvg = feather.icons[this.options.icon].toSvg()
        }
        return `
            <button id="${this.elementId}" name="${this.name}" class="btn btn-${btnClass} type="button">
                ${iconSvg}
                ${this.label}
            </button>`
    }
}

module.exports = Button