const createFocusTrap = require("focus-trap")
const Control = require("../control");


module.exports = class Dialog extends Control {
    constructor(options={}) {
        /* Options
         *  centered=false
         *  title="Title"
         *  groupButtons=false
         *  noCloseButton=false
         */
        super(options);

        this.onCancel = null;
        //this.onOk = null;

        this.headerElement = null;
        this.bodyElement = null;
        this.footerElement = null;
        this._titleElement = null;
        this._dialogElement = null;
        this._closeElement = null;
    }

    value() {
        return null;
    }

    //show(onOk, onCancel) {
    show(onCancel) {
        this.onCancel = onCancel;

        document.body.appendChild(this.createElement());
        
        super.show();
        this.focusTrap.activate()
    }

    hide() {
        super.hide();
        this.focusTrap.deactivate()

        document.body.removeChild(this.element);
        this.headerElement = null;
        this.bodyElement = null;
        this.footerElement = null;
        this._titleElement = null;
        this._dialogElement = null;
        this._closeElement = null;
    }

    
    _onCancel(ev) {
        this.hide();
        this.onCancel();
    }


    setTitle(title) {
        if (!this._titleElement) {
            this._titleElement = document.createElement('h1');
            this.headerElement.appendChild(this._titleElement);
        }
        this._titleElement.innerHTML = title;
    }

    createElement() {
        //this.element = document.createElement('div');
        super.createElement();

        this.focusTrap = createFocusTrap(this.element);

        if (this.options.centered == true){
            this.element.className = 'foreground-centered';
        } else {
            this.element.className = 'foreground';
        }

        this._dialogElement = document.createElement('div');
        this._dialogElement.className = 'dialog';
        //this._dialogElement.style.userSelect = "none";
        //this._dialogElement.style.display = "flex";
        //this._dialogElement.style.flexDirection = "column"
        //this._dialogElement.style.width = this.options.width;
        //this._dialogElement.style.height = this.options.height;
        this.element.appendChild(this._dialogElement);

        var header = document.createElement('div');
        header.className = 'dialog-header';
        header.style.display = 'flex';
        //header.style.flexDirection = 'row';
        this._dialogElement.appendChild(header);
        
        this.headerElement = document.createElement('div');
        //this.headerElement.style.display = 'flex';
        this.headerElement.className = 'dialog-header-content';
        //this.headerElement.style.flexGrow = 1;
        header.appendChild(this.headerElement);

        if (!this.options.noCloseButton) {
            this._closeElement = document.createElement('div');
            this._closeElement.className = 'dialog-close';
            this._closeElement.innerHTML = '&times;'
            this._closeElement.addEventListener('click', (ev) => {
                this._onCancel();
            });
            header.appendChild(this._closeElement);
        }

        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'dialog-body';
        //this.bodyElement.style.flexGrow = 1;
        this._dialogElement.appendChild(this.bodyElement);

        this.footerElement = document.createElement('div');
        this.footerElement.className = 'dialog-footer';
        if (this.options.groupButtons) {
            this.footerElement.classList.add('button-group-row')
        }
        this._dialogElement.appendChild(this.footerElement);

        super.hide();

        this.element.addEventListener('click', (ev) => {
            //this._onCancel();
        });

        this._dialogElement.addEventListener('click', (ev) => {
            ;
        })

        console.log(this.options.title)
        if (this.options.title) {
            this.setTitle(this.options.title)
        }

        //this.bodyElement.innerHTML = 'Some shit that is in a dialog is here now';
        //this.footerElement.innerText = 'This is the footer'

        return this.element;
    }

}