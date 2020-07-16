const feather = require('feather-icons')

const Control = require("./control");

module.exports = class Button extends Control {
    constructor(label, onClick, options) {
        /* Options
         *  style = <blan>|primary
         *  icon = feather icon name
         */
        super(options);
        this.label = label;
        this.onClick = onClick;
    }

    lock() {
        this.element.disabled = true
    }

    unlock() {
        this.element.disabled = false
    }

    setLabel(label) {
        this.label = label
        if (this.labelElement) {
            this.labelElement.innerHTML = label
        }
    }

    createElement() {
        this.element = document.createElement('button');
        this.element.style.minWidth = this.options.width;
        this.element.style.minHeight = this.options.height;

        if (this.options.style) {
            this.element.classList.add(this.options.style)
        }

        if (this.options.className) {
            this.element.classList.add(this.options.className)
        }

        this._displayElement = document.createElement('span')
        this.element.appendChild(this._displayElement)

        if (this.options.icon) {
            this.iconElement = document.createElement('template')
            this.iconElement.innerHTML = feather.icons[this.options.icon].toSvg(
                {
                    class: 'icon',
                    width: '',
                    height: ''
                }
            )
            this._displayElement.appendChild(this.iconElement.content.firstChild)
        }

        this.labelElement = document.createElement('span')
        this.labelElement.className = 'label'
        this._displayElement.appendChild(this.labelElement)
        
        this.element.setAttribute('title', this.label)
        this.labelElement.innerHTML = this.label

        this.element.addEventListener('click', (ev) => {
            ev.preventDefault();
            this.onClick(ev);
        })

        return this.element
    }

}
