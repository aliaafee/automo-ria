const Scrolled = require("./scrolled");

module.exports = class ListBox extends Scrolled {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * 
         */
        super(options);

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onSelectItem = onSelectItem;

        this.data = [];
        this._itemIds = [];
        this._itemElements = [];

        this._listElement = null;

        this._selectedItem = null;
        this._selectedElement = null;

        this._locked = false;

        this._onItemClicked = (event) => {
            if (this._locked) {
                return;
            }
            this.clearSelection();

            this._selectedElement = event.currentTarget;
            
            this._highlightSelection();
            this._onSelectItem(event);
        }
    }

    lock() {
        this._locked = true;
        this.element.classList.add('locked');
    }

    unlock() {
        this._locked = false;
        this.element.classList.remove('locked')
    }

    _createListItem(itemid, label) {
        var item = document.createElement('li');
        item.setAttribute('item-id', itemid);
        item.innerHTML = label;

        item.addEventListener('click', this._onItemClicked);

        return item;
    }

    _clear() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }
    }

    _highlightSelection() {
        this._selectedElement.className = 'selected';
    }

    _onSelectItem(event) {
        this._selectedItem = null;
        var selectedId = this._selectedElement.getAttribute('item-id');
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == selectedId) {
                this._selectedItem = this.data[i];
                this.onSelectItem(this._selectedItem);
                return
            }
        }
    }

    value() {
        return this._selectedItem;
    }

    setSelection(itemId) {
        if (itemId == null || itemId == '') {
            this.clearSelection();
            return;
        }
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == itemId) {
                this.clearSelection();

                this._selectedElement = this._itemElements[i];
                this._selectedItem = this.data[i];
                
                this._highlightSelection();
                this._selectedElement.scrollIntoView();
            }
        }
    }

    clearSelection() {
        if (this._selectedElement != null) {
            this._selectedElement.className = null;
        }
        this._selectedElement = null;

        this._selectedItem = null;
    }

    setData(data) {
        this.data = data;
        this.displayData();
    }

    appendData(data) {
        if (!this.data) {
            this.data = data
        } else {
            this.data = this.data.concat(data);
        }
        this.displayData(true);
    }

    displayData(noScroll) {
        this._clear();
        
        this._itemIds = [];
        this._itemElements = [];
        this.data.forEach((item) => {
            var item_id = this.idFunction(item);

            this._itemIds.push(item_id);

            var elem = this._createListItem(
                item_id,
                this.labelFunction(item)
            );

            this._listElement.appendChild(elem);
            this._itemElements.push(elem);
        })

        if (!noScroll) {
            this.element.scrollTop = 0;
        }       
    }

    createElement() {
        super.createElement();

        this.element.classList.add('list-box');
        
        this._listElement =  document.createElement('ul');
        this.element.appendChild(this._listElement);

        return this.element;
    }
}