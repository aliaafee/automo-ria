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
        //this._itemElements = [];

        this._listDataItems = {};
        this._listChildElems = {};

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

    _highlightSelection() {
        this._selectedElement.className = 'selected';
    }

    _onSelectItem(event) {
        this._selectedItem = null;
        var selectedItemId = this._selectedElement.getAttribute('item-id');

        this._selectedItem = this._listDataItems[selectedItemId];
        this.onSelectItem(this._selectedItem);
    }

    value() {
        return this._selectedItem;
    }

    setSelection(itemId) {
        if (itemId == null || itemId == '') {
            this.clearSelection();
            return;
        }

        this._selectedItem = this._listDataItems[itemId]

        this.clearSelection();
        this._selectedElement = this._listChildElems[itemId];
        this._highlightSelection();
        this._selectedElement.scrollIntoView();
    }

    clearSelection() {
        if (this._selectedElement != null) {
            this._selectedElement.className = null;
        }
        this._selectedElement = null;

        this._selectedItem = null;
    }

    _clear() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }

        this._listChildElems = {}
        this._listDataItems = {}
        this._data = null;
        //this._itemIds = [];
    }

    _appendData(data) {
        if (this.data == null) {
            this.data = data;
        } else {
            this.data = this.data.concat(data);
        }

        data.forEach((item) => {
            var item_id = this.idFunction(item)
            
            //this._itemIds.push(item_id);

            this._listDataItems[item_id] = item
            
            this._listChildElems[item_id] = this._createListItem(
                item_id,
                this.labelFunction(item)
            );

            this._listElement.appendChild(this._listChildElems[item_id]);
        })
    }

    setData(data) {
        this._clear();
        this._appendData(data);
    }

    /*
    appendData(data) {
        this._appendData()
        return
        if (!this.data) {
            this.data = data
        } else {
            this.data = this.data.concat(data);
        }
        this.displayData(true);
    }*/
    /*
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
    }*/

    createElement() {
        super.createElement();

        this.element.classList.add('list-box');
        
        this._listElement =  document.createElement('ul');
        this.element.appendChild(this._listElement);

        return this.element;
    }
}