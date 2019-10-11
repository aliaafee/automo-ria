

class Control {
    constructor(elementId) {
        this.elementId = elementId;

        this._element = null;
    }

    getHtml() {
        return `<input id="${this.elementId}" />`;
    }

    setupEvents() {
        return;
    }

    element() {
        if (this._element == null) {
            this._element = $(`#${this.elementId}`);
        }
        return this._element;
    }

    val() {
        return this.element().val();
    }

    setupEvents() {
        return;
    }

    render(target) {
        if (target == null) {
            target = $(`#${this.elementId}`);
        }
        target.replaceWith(this.getHtml());
        this._element = $(`#${this.elementId}`);
        this.setupEvents();
    }
}

module.exports = Control;