const Control = require("./control");

module.exports = class Button extends Control {
    constructor(label, onClick, options) {
        super(options);
        this.label = label;
        this.onClick = onClick;
    }

    createElement() {
        this.element = document.createElement('button');
        this.element.style.minWidth = this.options.width;
        this.element.style.minHeight = this.options.height;
        
        this.element.innerHTML = this.label;

        this.element.addEventListener('click', (ev) => {
            ev.preventDefault();
            this.onClick(ev);
        })

        return this.element
    }

}
