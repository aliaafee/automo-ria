const Control = require('./control');

module.exports = class ResourceAccordion extends Control {
    constructor(idFunction, labelFunction, onSelectItem, options={}) {
        super(options);

        this.resource_data = null;

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onSelectItem = onSelectItem;

        this._onItemClicked = (event) => {
            //this.clearSelection();

            //this._selectedElement = event.currentTarget;
            
            //this._highlightSelection();
            //this._onSelectItem(event);
        }
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

    _setData(data) {
        this.resource_data = data

        this._clear();

        this.resource_data.items.forEach((item) => {
            var elem = this._createListItem(
                this.idFunction(item),
                this.labelFunction(item),
            )
            this._listElement.appendChild(elem);
        })
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

    setResourceUrl(url) {
        connection.get(
            url,
            data => {
                this._setData(data)
            },
            (error) => {
                console.log(error);
            },
            () => {
                ;
            }
        )
    }

    createElement() {
        super.createElement()

        this._listElement = document.createElement('ul')
        this.element.appendChild(this._listElement);

        return this.element;
    }
}