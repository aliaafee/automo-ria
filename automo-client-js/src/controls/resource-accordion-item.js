const Control = require('./control');
const Spinner = require('./spinner');


module.exports = class ResourceAccordionItem extends Control {
    constructor(itemData, options) {
        super(options);

        this.itemData = itemData;

        this.resourceData = null;

        this.spinner = new Spinner();

        this.headerElement = null;
        this.bodyElement = null;

        this._onClickHeader = (event) => {
            this.toggleBody();
        }
    }

    _showSpinner() {
        this.bodyElement.appendChild(this.spinner.createElement());
    }

    _hideSpinner() {
        this.spinner.removeElement();
    }

    toggleBody() {;
        if (this.bodyElement == null) {
            this.showBody();
            return
        }
        if (this.bodyElement.style.display == 'none') {
            this.showBody();
            return;
        }
        this.hideBody();
    }

    showBody() {
        if (this.bodyElement == null) {
            this.element.appendChild(this.createBodyElement());
        }
        this.bodyElement.style.display = 'flex';
        this.loadResource();
    }

    hideBody() {
        this.bodyElement.style.display = 'none';
        this._hideSpinner();
    }

    loadResource() {
        if (this.resourceData != null) {
            return;
        }
        this.errorElement.style.display = 'none'
        this._showSpinner();
        connection.get(
            this.itemData.url,
            (data) => {
                this.resourceData = data;
                this.displayResource();
            },
            (error) => {
                console.log(error);
                this.errorElement.style.display = 'flex'
                this.errorElement.innerHTML = 'Faild to load'
            },
            () => {
                this._hideSpinner();
            }
        )
    }

    displayResource() {
        return;
    }

    createHeaderElement() {
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'root-item-head';
        this.headerElement.innerHTML = 'Title';
        this.headerElement.addEventListener('click', this._onClickHeader);

        return this.headerElement;

    }

    createBodyElement() {
        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'root-item-body';
        this.bodyElement.style.flexGrow = 1;

        this.errorElement = document.createElement('div');
        this.errorElement.className = 'error';
        this.errorElement.style.display = 'none';
        this.bodyElement.appendChild(this.errorElement);

        return this.bodyElement;
    }

    createElement() {
        this.element = document.createElement('li');
        this.element.className = 'root-item';
        this.element.style.flexGrow = 1;

        this.element.appendChild(this.createHeaderElement());
        //this.element.appendChild(this.createBodyElement());

        //this.hideBody();

        return this.element;
    }
}