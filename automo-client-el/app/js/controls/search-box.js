const Control = require('./base-control');
const feather = require('feather-icons');
const Popper = require('popper.js');


class SearchBox extends Control {
    constructor(inputId, searchFunction, idFunction, labelFunction, onResultClicked, placeHolder = "Search") {
        super(inputId);
        this.placeHolder = placeHolder
        this.searchFunction = searchFunction;
        this.idFunction = idFunction;
        this.labelFunction = labelFunction;
        this.onResultClicked = onResultClicked;

        this.inputElement = null;
        this.popup = null;
        this.popupElement = null
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

        $(`#${this.inputId}-popup .list-group-item`).click((e) => {
            this.onResultClicked(
                $(e.currentTarget).attr("result-id")
            );
            this.popupElement.hide();
        })

        this.popupElement.scrollTop(0);
        this.popupElement.show();
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
        this.input()
            .keyup(() => {
                this.search();
            })
            .focus(() => {
                this.popup.update();
                this.search();
            })
            .bind('blur', () => {
                this.popupElement.hide();
            })

        $(`#${this.inputId}-popup`)
            .mouseout(() => {
                this.input().bind('blur', () => {
                    this.popupElement.hide();
                })
            })
            .mouseover(() => {
                this.input().unbind('blur');
            })
        }

    render(target) {
        super.render(target);
        this.popupElement = $(`#${this.inputId}-popup`);
        this.popupElement.hide();

        this.popup = new Popper(
            $(`#${this.inputId}`),
            $(`#${this.inputId}-popup`),
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
    }

    getHtml() {
        return `
            <div class="input-group">
                <div class="input-group-prepend">
                    <div class="input-group-text">
                        ${feather.icons['search'].toSvg()}
                    </div>
                </div>
                <input type="text" class="form-control" id="${this.inputId}" placeholder="${this.placeHolder}">
                <div id="${this.inputId}-popup" class="popup"></div>
            </div>
        `
    }
}

module.exports = SearchBox;