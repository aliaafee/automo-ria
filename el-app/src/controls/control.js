
class Control {
    constructor(options = {}) {
        this.element = null;
        this.options = options;
    }

    createElement() {
        //Create the element
        this.element = document.createElement('div');

        //Add styles
        this.element.style.display = "flex";
        this.element.style.userSelect = "none";

        //Attache events

        return this.element;
    }

    hide() {
        this.element.style.display = "none";
    }

    show() {
        this.element.style.display = "flex";
    }
}


module.exports = Control;