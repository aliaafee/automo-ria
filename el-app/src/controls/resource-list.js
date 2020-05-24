const ListBox = require("./list-box")
const Spinner = require("./spinner")
const SpinnerForeground = require("./spinner-foreground")

module.exports = class ResourceList extends ListBox {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * 
         */
        super(idFunction, labelFunction, onSelectItem, options);

        this.spinner = new Spinner();

        this.resource_data = {}
    }

    setResourceUrl(url) {
        this.spinner.show();
        this._listElement.style.display = 'none';
        connection.get(
            url,
            data => {
                console.log(data);
                this.resource_data = data;
                this.setData(data.items)
            },
            (error) => {
                console.log(error);
                if (error.status == 404) {
                    this.resource_data = {};
                    this.setData([]);
                    this.displayNotFound();
                }
            },
            () => {
                this.spinner.hide();
                this._listElement.style.display = 'flex';
            }
        )
    }

    _onLoadNextClicked(event) {
        event.target.style.display = 'none';
        this.spinner.show();
        connection.get(
            this.resource_data.next,
            data => {
                console.log(data);
                this.resource_data = data;
                this.appendData(data.items)
            },
            (error) => {
                console.log(error);
                this.displayData(true)
            },
            () => {
                this.spinner.hide();
            }
        )
    }

    displayNotFound() {
        var next_elem = document.createElement('li');
        next_elem.className = 'button'
        next_elem.innerHTML = 'Not Found.';
        this._listElement.appendChild(next_elem);
    }


    displayData(noScroll) {
        super.displayData(noScroll);

        if (this.resource_data.next) {
            console.log("XX");
            var next_elem = document.createElement('li');
            next_elem.setAttribute('next-url', this.resource_data.next);
            next_elem.className = 'button'
            next_elem.innerHTML = 'Load More...';
            next_elem.addEventListener('click', (event) => { 
                this._onLoadNextClicked(event) 
            } )
            this._listElement.appendChild(next_elem);
        }
    }

    createElement() {
        super.createElement();

        this.element.style.flexDirection = 'column';
        this._listElement.style.flexGrow = 0;

        this.element.appendChild(this.spinner.createElement());
        this.spinner.hide();

        return this.element;
    }
}