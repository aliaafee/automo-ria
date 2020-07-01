
module.exports = class Control {
    constructor(options = {}) {
        /* Options
         *  widht, height =  css size
         *  className = class name of the element
         */
        this.element = null;
        this.options = options;

        this._display = null
    }

    focus() {
        this.element.focus();
    }

    removeElement() {
        if (this.element == null) {
            return
        }
        parent = this.element.parentElement

        if (parent == null) {
            return
        }

        parent.removeChild(this.element);
    }

    createElement() {
        //Create the element
        this.element = document.createElement('div');

        //Add styles
        //this.element.style.display = "flex";
        if (this.options.className) {
            this.element.classList.add(this.options.className)
        }
        this.element.style.userSelect = "none";
        this.element.style.width = this.options.width;
        this.element.style.height = this.options.height;

        //Attache events

        return this.element;
    }

    hideSoft() {
        this.element.style.visibility = 'hidden';
    }

    hide() {
        this._display = this.element.style.display
        this.element.style.display = "none";
    }

    lock() {

    }

    unlock() {
        
    }

    show() {
        if (this._display) {
            if (this._display != 'none') {
                this.element.style.display = this._display;
            }
            this.element.style.display = ''
        } else {
            this.element.style.display = '';
        }
        
        this.element.style.visibility = '';
    }
}
