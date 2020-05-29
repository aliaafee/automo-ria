const Control = require("../control");


module.exports = class Dialog extends Control {
    constructor(options={}) {
        /* Options
         *  centered=false
         */
        super(options);

        this.onCancel = null;
        this.onOk = null;

        this.headerElement = null;
        this.bodyElement = null;
        this.footerElement = null;

        this._dialogElement = null;
        this._closeElement = null;
    }

    value() {
        return null;
    }

    show(onOk, onCancel) {
        this.onOk = onOk;
        this.onCancel = onCancel;

        super.show();
    }

    _onCancel(ev) {
        this.hide();
        this.onCancel();
    }

    _onOk(ev) {
        this.hide();
        this.onOk(this.value());
    }

    createElement() {
        this.element = document.createElement('div');

        if (this.options.centered == true){
            this.element.className = 'foreground-centered';
        } else {
            this.element.className = 'foreground';
        }

        this._dialogElement = document.createElement('div');
        this._dialogElement.className = 'dialog';
        this._dialogElement.style.userSelect = "none";
        this._dialogElement.style.display = "flex";
        this._dialogElement.style.flexDirection = "column"
        this._dialogElement.style.width = this.options.width;
        this._dialogElement.style.height = this.options.height;
        this.element.appendChild(this._dialogElement);

        var header = document.createElement('div');
        header.className = 'dialog-header';
        header.style.display = 'flex';
        //header.style.flexDirection = 'row';
        this._dialogElement.appendChild(header);
        
        this.headerElement = document.createElement('div');
        this.headerElement.style.display = 'flex';
        this.headerElement.style.flexGrow = 1;
        header.appendChild(this.headerElement);

        this._closeElement = document.createElement('div');
        this._closeElement.className = 'dialog-close';
        this._closeElement.innerHTML = '&times;'
        header.appendChild(this._closeElement);

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'dialog-body';
        this.bodyElement.style.flexGrow = 1;
        this._dialogElement.appendChild(this.bodyElement);

        this.footerElement = document.createElement('div');
        this.footerElement.className = 'dialog-footer';
        this._dialogElement.appendChild(this.footerElement);

        this.hide();

        this.element.addEventListener('click', (ev) => {
            //this._onCancel();
        });

        this._dialogElement.addEventListener('click', (ev) => {
            ;
        })

        this._closeElement.addEventListener('click', (ev) => {
            this._onCancel();
        });

        if (this.options.title != null) {
            var title = document.createElement('h1');
            title.innerText = this.options.title;
            this.headerElement.appendChild(title);
        }

        //this.bodyElement.innerHTML = 'Some shit that is in a dialog is here now';
        //this.footerElement.innerText = 'This is the footer'

        return this.element;
    }

}