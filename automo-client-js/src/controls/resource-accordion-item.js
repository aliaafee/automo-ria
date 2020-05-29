const Control = require('./control');
const Spinner = require('./spinner');


module.exports = class ResourceAccordionItem extends Control {
    constructor(itemData, options) {
        super(options);

        this.itemData = itemData;

        this.resourceData = null;

        this.spinner = new Spinner();

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

    toggleBody() {
        if (this.bodyElement.style.display == 'none') {
            this.showBody();
            return;
        }
        this.hideBody();
    }

    showBody() {
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

        this._showSpinner();
        connection.get(
            this.itemData.url,
            (data) => {
                this.resourceData = data;
                this.displayResource();
            },
            (error) => {
                console.log(error);
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

        return this.bodyElement;
    }

    createElement() {
        this.element = document.createElement('li');
        this.element.className = 'root-item';

        this.element.appendChild(this.createHeaderElement());
        this.element.appendChild(this.createBodyElement());

        this.hideBody();

        return this.element;
    }
}