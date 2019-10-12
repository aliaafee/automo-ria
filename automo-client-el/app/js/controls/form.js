const Control = require('./base-control');


class Form extends Control {
    constructor(elementId, name = "", options = {}) {
        /* Supported options ...
         * title="Title of the form"
         */
        super(elementId);

        this.name = name;
        this.options = options;
        this._fields = [];
        this._buttons = [];

        this._locked = false;
    }

    validate() {
        var isValid = true;

        this._fields.forEach((field) => {
            if (field.validate() == false) {
                isValid = false;
            }
        });

        return isValid;
    }


    clearValidation() {
        this._fields.forEach((field) => {
            field.markValid();
        });
    }


    addField(field) {
        field.options.sideLabel = true;
        this._fields.push(field);
    }

    addButton(button) {
        this._buttons.push(button);
    }

    getHeaderHtml() {
        var title = ""
        if (this.options.title) {
            title = `<h5>${this.options.title}</h5>`;
        }
        return title;
    }

    getHtml() {
        
        return `
            <form id="${this.elementId}" name="${this.name}">
                ${this.getHeaderHtml()}
                <div id="${this.elementId}-fields">
                </div>
                
            </form>`;
    }

    lock() {
        this._fields.forEach((field) => {
            field.lock();
        })
        this._locked = true;
    }


    unlock() {
        this._fields.forEach((field) => {
            field.unlock();
        })
        this._locked = false;
    }


    render(target) {
        if (target == null) {
            target = $(`#${this.elementId}`);
        }

        target.replaceWith(this.getHtml());

        var fieldsElement = $(`#${this.elementId}-fields`);

        this._fields.forEach((field) => {
            if ($(`#${field.elementId}`).length == 0) {
                fieldsElement.append(`<input id="${field.elementId}" >`);
            }
            field.render();
        })

        if (this._buttons.length > 0) {
            this.element().append(`
                <div id="${this.elementId}-buttons" class="form-group"></div>
            `)

            var buttonsElement = $(`#${this.elementId}-buttons`);

            this._buttons.forEach((button) => {
                if ($(`#${button.elementId}`).length == 0) {
                    buttonsElement.append(`<button id="${button.elementId}"> </button>`);
                }
                button.render();
            })
        }

        this.setupEvents();
    }
}


module.exports = Form;