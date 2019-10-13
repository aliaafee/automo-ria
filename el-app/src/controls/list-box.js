const Scrolled = require("./scrolled");

class ListBox extends Scrolled {
    constructor(idFunction, labelFunction, onSelectItem, height) {
        super(height);

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onSelectItem = onSelectItem;
        this.data = [];

        this._listElement = null;

        this._selectedElement = null;

        this._listItems = [];
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
        this.onSelectItem(event.target.getAttribute('item-id'));
    }

    setData(data) {
        this.data = data;
        this.displayData();
    }

    displayData() {
        this._clear();
        
        this.data.forEach((item) => {
            var elem = this._createListItem(
                this.idFunction(item),
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