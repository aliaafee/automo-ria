const Control = require('../controls/base-control');

class Frame extends Control {
    constructor(elementId) {
        super(elementId);
    }


    getHtml() {
        
        return `
            <div id="${this.elementId}" class="container">
                <div id="${this.elementId}-contents">
                </div>
            </div>`;
    }

    getContentsElement() {
        return $(`#${this.elementId}-contents`);
    }


    render(target) {
        super.render(target);
    }
}


module.exports = Frame;