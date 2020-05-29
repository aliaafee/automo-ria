const Control = require("./control");

module.exports = class Tile extends Control {
    constructor(title, options) {
        super(options)

        this.title = title
    }

    createElement() {
        super.createElement();

        this.element.className = 'tile';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        
        this._titleElement = document.createElement('h1');
        this._titleElement.className = 'tile-title';
        this._titleElement.innerHTML = this.title;
        this.element.appendChild(this._titleElement);

        this._tileBodyElement = document.createElement('div');
        this._tileBodyElement.className = 'tile-body';
        this.element.appendChild(this._tileBodyElement);

        return this.element;
    }
}