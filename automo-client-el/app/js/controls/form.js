const Control = require('./base-control');


class Form extends Control {
    constructor(elementId, name = "", options = {}) {
        /* Supported options ...
         * 
         */
        super(elementId);
        this.name = name;
        this.options = options;
        this._fields = [];
    }

    validate() {
        var isValid = true;

        this._fields.forEach((field) => {
            if (field.validate() == false) {
                isValid = false;
            }
        })

        return isValid;
    }


    addField(field) {
        this._fields.push(field);
    }


    getHtml() {
        return `<form id="${this.elementId}" name="${this.name}"></form>`
    }

    lock() {
        this._fields.forEach((field) => {
            field.lock();
        })
    }


    unlock() {
        this._fields.forEach((field) => {
            field.unlock();
        })
    }


    render(target) {
        if (target == null) {
            target = $(`#${this.elementId}`);
        }

        target.replaceWith(this.getHtml());

        this._fields.forEach((field) => {
            if ($(`#${field.elementId}`).length == 0) {
                this.element().append(`<input id="${field.elementId}" >`);
            }
            field.render();
        })

        this.setupEvents();
    }
}


module.exports = Form;