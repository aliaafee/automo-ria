const Control = require('./control');
const Spinner = require('./spinner');
const ResourceAccordionItem = require('./resource-accordion-item');

module.exports = class ResourceAccordion extends Control {
    constructor(idFunction, itemClass=ResourceAccordionItem, options={}) {
        super(options);

        this.itemClass = itemClass;
        this.data = null;
        this.resourceData = null;
        this._itemData = {};
        this._itemChildren = {};

        this.idFunction = idFunction;
        //this.labelFunction = labelFunction;

        this.spinner = new Spinner();

        /*
        this._onItemClicked = (event) => {
            var selectedId = event.currentTarget.getAttribute('item-id');

            var selected_item = this._itemData[selectedId];

            console.log(selected_item);
        }
        */

        this._onNextItemClicked = (event) => {
            this._loadNext();
        }
    }

    _showSpinner() {
        var element = document.createElement('li');
        element.classList = 'root-item spinner-item';
        this._listElement.appendChild(element);

        element.appendChild(this.spinner.createElement())
    }

    _hideSpinner() {
        var element = this.spinner.element.parentElement;
        element.removeChild(this.spinner.element);
        element.parentElement.removeChild(element)
    }

    /*
    _createListItem(itemid, label) {
        var item = document.createElement('li');
        item.setAttribute('item-id', itemid);
        item.className = 'root-item';
        item.innerHTML = label;

        //item.addEventListener('click', this._onItemClicked);

        return item;
    }
    */

    _createNextItem() {
        this._nextElement = document.createElement('li');
        this._nextElement.classList = 'root-item next-item';
        this._nextElement.innerHTML = 'Load More...'

        this._nextElement.addEventListener('click', this._onNextItemClicked);
        
        return this._nextElement;
    }

    _removeNextItem() {
        this._nextElement.parentElement.removeChild(this._nextElement);
    }

    _clear() {
        for (var key in this._itemChildren) {
            this._listElement.removeChild(this._itemChildren[key].element);
        }
        if (this._nextElement != null) {
            this._listElement.removeChild(this._nextElement);
            this._nextElement = null;
        }
        this._data = null;
        this._itemChildren = {};
    }
    
    _setData(data) {
        this._clear();
        this._appendData(data);
    }

    _appendData(data) {
        if (this.data == null) {
            this.data = data;
        } else {
            this.data = this.data.concat(data);
        }

        data.forEach((item) => {
            var item_id = this.idFunction(item)

            this._itemChildren[item_id] = new this.itemClass(item);
            this._listElement.appendChild(this._itemChildren[item_id].createElement());
        })

        if (this.resourceData.next != null) {
            this._listElement.appendChild(this._createNextItem());
        } else {
            this._nextElement = null;
        }
    }

    _loadNext() {
        this._removeNextItem();
        this._showSpinner();
        connection.get(
            this.resourceData.next,
            (data) => {
                this.resourceData = data;
                this._appendData(this.resourceData.items);
            },
            (error) => {
                console.log(error);
            },
            () => {
                this._hideSpinner();
            }
        )
    }

    setResourceUrl(url) {
        //this._listElement.style.display = 'none';
        this._clear();
        this._showSpinner();
        connection.get(
            url,
            data => {
                this.resourceData = data;
                
                this._setData(this.resourceData.items);
            },
            (error) => {
                console.log(error);
            },
            () => {
                this._hideSpinner();;
            }
        )
    }

    createElement() {
        super.createElement()

        this.element.className = 'accordion';

        this._listElement = document.createElement('ul');
        this._listElement.style.flexDirection = 'column';
        this._listElement.className = 'root-list';
        this.element.appendChild(this._listElement);

        return this.element;
    }
}