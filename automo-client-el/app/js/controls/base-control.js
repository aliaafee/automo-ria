

class Control {
    constructor(inputId) {
        this.inputId = inputId;

        this._input = null;
    }

    getHtml() {
        return `<input id="${this.inputId}" />`;
    }

    setupEvents() {
        return;
    }

    input() {
        if (this._input == null) {
            this._input = $(`#${this.inputId}`);
        }
        return this._input;
    }

    val() {
        return this.input().val();
    }

    render(target) {
        if (target == null) {
            target = $(`#${this.inputId}`);
        }
        target.replaceWith(this.getHtml());
        this.setupEvents();
    }
}

module.exports = Control;