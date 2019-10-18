
class Control {
    constructor(options = {}) {
        /* Options
         *  widht, height =  css size
         */
        this.element = null;
        this.options = options;
    }

    focus() {
        this.element.focus();
    }

    createElement() {
        //Create the element
        this.element = document.createElement('div');

        //Add styles
        this.element.style.display = "flex";
        this.element.style.userSelect = "none";
        this.element.style.width = this.options.width;
        this.element.style.height = this.options.height;

        //Attache events

        return this.element;
    }

    hide() {
        this.element.style.display = "none";
    }

    show(display = 'flex') {
        this.element.style.display = display;
    }
}


module.exports = Control;