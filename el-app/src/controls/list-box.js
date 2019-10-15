const Scrolled = require("./scrolled");

class ListBox extends Scrolled {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * 
         * Options:
         *  height
         */
        super(options);

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onSelectItem = onSelectItem;

        this.data = [];
        this._itemIds = [];

        this._listElement = null;

        this._selectedItem = null;
        this._selectedElement = null;
    }

    _createListItem(itemid, label) {
        var item = document.createElement('li');
        item.setAttribute('item-id', itemid);
        item.innerHTML = label;
        return item;
    }

    _clear() {
        while (this._listElement.firstChild) {
            this._listElement.firstChild.remove();
        }
    }

    _onSelectItem(event) {
        this._selectedItem = null;
        var selectedId = event.target.getAttribute('item-id');
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == selectedId) {
                this._selectedItem = this.data[i];
                this.onSelectItem(this._selectedItem);
                return
            }
        }
    }

    setData(data) {
        this.data = data;
        this.displayData();
    }

    displayData() {
        this._clear();
        
        this._itemIds = []
        this.data.forEach((item) => {
            var item_id = this.idFunction(item);

            this._itemIds.push(item_id);

            var elem = this._createListItem(
                item_id,
                this.labelFunction(item)
            );

            this._listElement.appendChild(elem);

            elem.addEventListener('click', (event) => {
                if (this._selectedElement != null) {
                    this._selectedElement.className = null;
                }
                this._selectedElement = event.target;
                this._selectedElement.className = 'selected';
                this._onSelectItem(event);
            })
        })

        this.element.scrollTop = 0;
    }

    createElement() {
        super.createElement();

        this.element.classList.add('list-box');
        
        this._listElement =  document.createElement('ul');
        this.element.appendChild(this._listElement);

        return this.element;
    }
}


module.exports = ListBox;