const Control = require('./base-control');
const feather = require('feather-icons');
const Popper = require('popper.js');


class SearchBox extends Control {
    constructor(elementId, searchFunction, idFunction, labelFunction, onResultClicked, placeHolder = "Search") {
        /* searchFunction(search_str) { return list_of_results }
         * idFunction(result) { return result.unique_id }
         * labelFunction(result) { return result.label }
         * onResultClicked(unique_id) { do something using code }
         */
        super(elementId);
        this.placeHolder = placeHolder
        this.searchFunction = searchFunction;
        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onResultClicked = onResultClicked;

        this._popup = null;
        this._popupElement = null
        this._selectedResultId = null
    }

    showPopup() {
        this._popup.update();
        this._popupElement.show();
    }

    hidePopup() {
        this._popupElement.hide();
    }

    showResults(results) {
        var resultHtml = ""
        results.forEach((result) => {
            resultHtml += `
                <li class="list-group-item list-group-item-action" result-id="${this.idFunction(result)}">
                    ${this.labelFunction(result)}
                </li>
            `
        })
        if (resultHtml == "") {
            resultHtml = `
                <li class="list-group-item list-group-item-action disabled">
                    Not Found
                </li>
            `
        }
        this._popupElement.html(`
            <ul class="list-group list-group-flush">
                ${resultHtml}
            </ul>
        `)

        $(`#${this.elementId}-popup .list-group-item`).click((e) => {
            this._selectedResultId = $(e.currentTarget).attr("result-id")
            this.onResultClicked(this._selectedResultId);
            this.hidePopup();
        })

        this._popupElement.scrollTop(0);
        this.showPopup();
    }

    val() {
        return this._selectedResultId
    }

    clearResults() {
        this._popupElement.hide()
        return
    }

    search() {
        if (super.val() == "") {
            this.clearResults();
            return;
        }
        this.searchFunction(super.val(), (result) => {
            this.showResults(result);
        });
    }

    setupEvents() {
        this.element()
            .keyup(() => {
                this.search();
            })
            .focus(() => {
                this.search();
            })
            .bind('blur', () => {
                this.hidePopup()
            })

        $(`#${this.elementId}-popup`)
            .mouseout(() => {
                this.element().bind('blur', () => {
                    this.hidePopup()
                })
            })
            .mouseover(() => {
                this.element().unbind('blur');
            })
        }


    render(target) {
        super.render(target);
        this._popupElement = $(`#${this.elementId}-popup`);

        this.hidePopup();
        this._popup = new Popper(
            $(`#${this.elementId}`),
            $(`#${this.elementId}-popup`),
            {
                placement: 'bottom',
                modifiers: {
                    autoSizing: {
                        enabled: true,
                        order: 1,
                        fn: (data) => {
                            data.offsets.popper.left = data.offsets.reference.left + 1;
                            data.styles.width = data.offsets.reference.width;
                            data.styles.height = '200px';
                            return data;
                        },
                    }
                }

            }
        )
        this._popup.update();
    }

    getHtml() {
        return `
            <div class="input-group">
                <div class="input-group-prepend">
                    <div class="input-group-text">
                        ${feather.icons['search'].toSvg()}
                    </div>
                </div>
                <input type="text" class="form-control" id="${this.elementId}" placeholder="${this.placeHolder}">
                <div id="${this.elementId}-popup" class="popup"></div>
            </div>
        `
    }
}

module.exports = SearchBox;