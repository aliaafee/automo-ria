const Control = require("./control");


module.exports = class Select extends Control {
    constructor(idFunction, labelFunction, options) {
        /* Options
         *  placeholder=""
         *  
         */
        super(options);

        this.idFunction = idFunction;
        this.labelFunction = labelFunction;

        this.data = [];
        this._itemIds = [];
    }

    value() {
        var selectedId = this.element.value;
        for (var i = 0; i < this._itemIds.length; i++) {
            if (this._itemIds[i] == selectedId) {
                return this.data[i];
            }
        }
        return null;
    }

    setValue(value) {
        this.setSelection(this.idFunction(value));
    }

    setData(data) {
        this.data = data;
        this.displayData();
    }

    setSelection(itemId) {
        this.element.value = itemId;
    }

    _clear() {
        while (this.element.firstChild) {
            this.element.firstChild.remove();
        }
    }

    _createListItem(itemid, label) {
        var item = document.createElement('option');
        item.setAttribute('value', itemid);
        item.innerText = label;

        return item;
    }

    displayData() {
        this._clear();

        this.element.appendChild(this._createListItem(
            null,
            `-- ${this.options.placeholder == null ? '' : this.options.placeholder} --`
        ));

        this._itemIds = []
        this._itemElements = []
        this.data.forEach((item) => {
            var item_id = this.idFunction(item);

            this._itemIds.push(item_id);

            var elem = this._createListItem(
                item_id,
                this.labelFunction(item)
            );

            this.element.appendChild(elem);
        })
    }

    isBlank() {
        if (this.element.value == null) {
            return true;
        }
        return false;
    }

    lock() {
        this.element.setAttribute('disabled', '');
    }

    unlock() {
        this.element.removeAttribute('disabled');
    }

    createElement() {
        this.element = document.createElement('select');

        if (this.options.placeholder != null) {
            this.element.setAttribute('placeholder', this.options.placeholder);
        }

        return this.element
    }

}
