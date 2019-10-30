const Control = require('./control');


module.exports = class Spitter extends Control {
    constructor(pane1, pane2, options = {}) {
        /* Options
         *  direction = 'row'|'column' (default='row')
         *  pane1Size = css size (if pane1Size is given, pane2Size is ignored)
         *  ((pane2Size = css size)) -> This Does not work
         */
        super(options);

        this.pane1 = pane1;
        this.pane2 = pane2;

        this.resizerSize = 5;
        this.resizerElement = null;

        this.pos1 = null;
        this.pos2 = null;
        this.pos3 = null;
        this.pos4 = null;

        this._resizeMouseDown = (ev) => {
            ev.preventDefault();
            this.pos3 = ev.clientX;
            this.pos4 = ev.clientY;
            console.log(this.pos3, this.pos4);
            document.addEventListener('mousemove', this._resizeMouseMove);
            document.addEventListener('mouseup', this._resizeMouseUp);
        }

        this._resizeMouseMove = (ev) => {
            ev.preventDefault();
            this.pos1 = this.pos3 - ev.clientX;
            this.pos2 = this.pos4 - ev.clientY;
            this.pos3 = ev.clientX;
            this.pos4 = ev.clientY;
            this._resize();
        }

        this._resizeMouseUp = (ev) => {
            document.removeEventListener('mousemove', this._resizeMouseMove);
            document.removeEventListener('mouseup', this._resizeMouseUp);
        }
    }


    _resize() {
        if (this.options.direction == 'column') {
            if (this.options.pane1Size != null) {
                this.pane1.element.style.height = (this.pane1.element.offsetHeight - this.pos2) + "px";
            } else {
                //This does not work, need to fix
                this.pane2.element.style.height = (this.pane2.element.offsetHeight + this.pos2) + "px";
            }
        } else {
            if (this.options.pane1Size != null) {
                this.pane1.element.style.width = (this.pane1.element.offsetWidth - this.pos1) + "px";
            } else {
                this.pane2.element.style.width = (this.pane2.element.offsetWidth + this.pos1) + "px";
            }
        }
    }


    _createResizerElement() {
        this.resizerElement = document.createElement('div');
        this.resizerElement.style.zIndex = '100';
        if (this.options.direction == 'column') {
            this.resizerElement.style.height = (this.resizerSize) + 'px';
            this.resizerElement.style.marginTop = '-' + (this.resizerSize / 2) + 'px';
            this.resizerElement.style.marginBottom = '-' + (this.resizerSize / 2) + 'px';
            this.resizerElement.style.width = '100%';
            this.resizerElement.style.cursor = 'ns-resize'
        } else {
            this.resizerElement.style.width = (this.resizerSize) +'px';
            this.resizerElement.style.marginLeft = '-' + (this.resizerSize / 2) +'px';
            this.resizerElement.style.marginRight = '-' + (this.resizerSize / 2) +'px';
            this.resizerElement.style.height = '100%';
            this.resizerElement.style.cursor = 'ew-resize'
        }
        //this.resizerElement.style.backgroundColor = 'red';
        this.resizerElement.addEventListener('mousedown', this._resizeMouseDown);

        return this.resizerElement;
    }


    createElement() {
        super.createElement();

        this.element.style.flexGrow = '1';

        if (this.options.direction == 'column') {
            this.element.style.flexDirection = 'column';
        }

        this.element.appendChild(this.pane1.createElement());

        if (this.options.pane1Size != null || this.options.pane2Size != null) {
            this.element.appendChild(this._createResizerElement());
        }
        
        this.element.appendChild(this.pane2.createElement());

        this.pane1.element.style.zIndex = 90;
        this.pane2.element.style.zIndex = 90;

        if (this.options.pane1Size != null) {
            this.pane2.element.style.flexGrow = 1;

            if (this.options.direction == 'column') {
                this.pane1.element.style.height = this.options.pane1Size;
            } else {
                this.pane1.element.style.width = this.options.pane1Size;
            }
        } else {
            if (this.options.pane2Size != null) {
                this.pane1.element.style.flexGrow = 1;
                
                if (this.options.direction == 'column') {
                    //Resize does not work in this case for some reason
                    //So we keep the resizer hidden for now
                    this.pane2.element.style.height = this.options.pane2Size;
                    this.resizerElement.style.display = 'none';
                } else {
                    this.pane2.element.style.width = this.options.pane2Size;
                }
            } else {
                this.pane1.element.style.flexGrow = 1;
                this.pane2.element.style.flexGrow = 1;
            }
        }

        return this.element;
    }
}