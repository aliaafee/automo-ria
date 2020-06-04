const ListBox = require("./list-box")
const Spinner = require("./spinner")
const SpinnerForeground = require("./spinner-foreground")

module.exports = class ResourceList extends ListBox {
    constructor(idFunction, labelFunction, onSelectItem, options) {
        /* idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(result) { do something using result }
         * autoLoadNext = false
         * 
         */
        super(idFunction, labelFunction, onSelectItem, options);

        this.spinner = new Spinner();

        this.resource_data = {}
    }

    setResourceUrl(url, onDone) {
        this.spinner.show();
        this._listElement.style.display = 'none';
        connection.get(
            url,
            data => {
                //console.log(data);
                this.resource_data = data;
                this.setData(data.items);
                if (onDone) {
                    onDone();
                }
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

    _onLoadNextClicked() {
        //event.target.style.display = 'none';
        this._nextElem.style.display = 'none'
        this.spinner.show();
        connection.get(
            this.resource_data.next,
            data => {
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

    _nextElemVisible() {
        if (this._nextElem == null) {
            return false;
        }

        var rect = this._nextElem.getBoundingClientRect();
        
        const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
        //const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

        const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
        //const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

        return (vertInView);
    }

    _autoLoadNext() {
        if (!this.options.autoLoadNext) {
            return
        }

        if (!this._nextElemVisible()) {
            return;
        }

        this._onLoadNextClicked();
    }

    displayNotFound() {
        var notFoundElem = document.createElement('li');
        notFoundElem.className = 'button'
        notFoundElem.innerHTML = 'Not Found.';
        this._listElement.appendChild(notFoundElem);
    }


    displayData(noScroll) {
        super.displayData(noScroll);

        this._nextElem = null;
        if (this.resource_data.next) {
            this._nextElem = document.createElement('li');
            this._nextElem.setAttribute('next-url', this.resource_data.next);
            this._nextElem.className = 'button'
            this._nextElem.innerHTML = 'Load More...';
            this._nextElem.addEventListener('click', (event) => { 
                this._onLoadNextClicked(event) 
            } )
            this._listElement.appendChild(this._nextElem);

            requestAnimationFrame(() => {
                this._autoLoadNext();
            })
        }
    }

    createElement() {
        super.createElement();

        this.element.style.flexDirection = 'column';
        this._listElement.style.flexGrow = 0;

        this.element.appendChild(this.spinner.createElement());
        this.spinner.hide();

        if (this.options.autoLoadNext) {
            this.element.addEventListener('scroll', () => {
                this._autoLoadNext();
            })
        }

        return this.element;
    }
}