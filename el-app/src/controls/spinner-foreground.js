const Control = require("./control");

class SpinnerForground extends Control {
    constructor(options) {
        super(options);
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'spinner-foreground';

        var spinner = document.createElement('div');
        spinner.className = 'spinner';

        this.element.appendChild(spinner);

        return(this.element);
    }
}

module.exports = SpinnerForground;