const Control = require('./base-control');
const feather = require('feather-icons');
const Popper = require('popper.js');


class SearchBox extends Control {
    constructor(elementId, searchFunction, idFunction, labelFunction, onResultClicked, placeHolder = "Search") {
        super(elementId);
        this.placeHolder = placeHolder
        this.searchFunction = searchFunction;
        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onResultClicked = onResultClicked;

        this.popup = null;
        this.popupElement = null
    }

    showPopup() {
        this.popup = new Popper(
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
        this.popup.update();
        this.popup.update();
        this.popupElement.show();
    }

    hidePopup() {
        this.popupElement.hide();
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
        this.popupElement.html(`
            <ul class="list-group list-group-flush">
                ${resultHtml}
            </ul>
        `)

        $(`#${this.elementId}-popup .list-group-item`).click((e) => {
            this.onResultClicked(
                $(e.currentTarget).attr("result-id")
            );
            //this.popupElement.hide();
            this.hidePopup();
        })

        this.popupElement.scrollTop(0);
        //this.popupElement.show();
        this.showPopup();
    }

    clearResults() {
        this.popupElement.hide()
        return
    }

    search() {
        if (this.val() == "") {
            this.clearResults();
            return;
        }
        this.searchFunction(this.val(), (result) => {
            this.showResults(result);
        });
    }

    setupEvents() {
        this.element()
            .keyup(() => {
                this.search();
            })
            .focus(() => {
                //this.popup.update();
                this.search();
            })
            .bind('blur', () => {
                //this.popupElement.hide();
                this.hidePopup()
            })

        $(`#${this.elementId}-popup`)
            .mouseout(() => {
                this.element().bind('blur', () => {
                    //this.popupElement.hide();
                    this.hidePopup()
                })
            })
            .mouseover(() => {
                this.element().unbind('blur');
            })
        }

    
    


    render(target) {
        super.render(target);
        this.popupElement = $(`#${this.elementId}-popup`);
        this.showPopup();
        this.hidePopup();
        /*
        this.popup = new Popper(
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
        )*/
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