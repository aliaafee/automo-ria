const Control = require("./control");

module.exports = class Button extends Control {
    constructor(label, onClick, options) {
        /* Options
         *  style = <blan>|primary
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

    createElement() {
        this.element = document.createElement('button');
        this.element.style.minWidth = this.options.width;
        this.element.style.minHeight = this.options.height;

        if (this.options.style) {
            this.element.classList.add(this.options.style)
        }
        
        this.element.innerHTML = this.label;

        this.element.addEventListener('click', (ev) => {
            ev.preventDefault();
            this.onClick(ev);
        })

        return this.element
    }

}
