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
            //this.resizerElement.style.left = (this.resizerElement.offsetLeft - this.pos1) + "px";
            //this.resizerElement.style.top = (this.resizerElement.offsetTop - this.pos2) + "px";
            this._resize();
        }

        this._resizeMouseUp = (ev) => {
            document.removeEventListener('mousemove', this._resizeMouseMove);
            document.removeEventListener('mouseup', this._resizeMouseUp);
        }
    }


    _resize() {
        if (this.options.direction == 'column') {
            this.resizerElement.style.top = (this.resizerElement.offsetTop - this.pos2) + "px";
            if (this.options.pane1Size != null) {
                this.pane1.element.style.height = this.resizerElement.offsetTop + "px";
            }
        } else {
            this.resizerElement.style.left = (this.resizerElement.offsetLeft - this.pos1) + "px";
            if (this.options.pane1Size != null) {
                this.pane1.element.style.width = this.resizerElement.offsetLeft + "px";
            } /* else {
                this.pane2.element.style.width = this.element.clientWidth - this.resizerElement.offsetLeft + "px";
            } */
        }
    }



    createElement() {
        super.createElement();

        this.element.style.flexGrow = '1';

        if (this.options.direction == 'column') {
            this.element.style.flexDirection = 'column';
        }

        this.resizerElement = document.createElement('div');
        this.resizerElement.style.position = 'absolute';
        if (this.options.direction == 'column') {
            this.resizerElement.style.height = '5px';
            this.resizerElement.style.width = '100%';
            this.resizerElement.style.cursor = 'ns-resize'
        } else {
            this.resizerElement.style.width = '5px';
            this.resizerElement.style.height = '100%';
            this.resizerElement.style.cursor = 'ew-resize'
        }
        //this.resizerElement.style.backgroundColor = 'red';
        this.resizerElement.addEventListener('mousedown', this._resizeMouseDown);

        this.element.appendChild(this.pane1.createElement());
        this.element.appendChild(this.resizerElement);
        this.element.appendChild(this.pane2.createElement());

        if (this.options.pane1Size != null) {
            this.pane2.element.style.flexGrow = 1;

            if (this.options.direction == 'column') {
                this.pane1.element.style.height = this.options.pane1Size;
                this.resizerElement.style.top = this.options.pane1Size;
            } else {
                this.pane1.element.style.width = this.options.pane1Size;
                this.resizerElement.style.left = this.options.pane1Size;
            }
        } else {
            if (this.options.pane2Size != null) {
                this.pane1.element.style.flexGrow = 1;
                
                if (this.options.direction == 'column') {
                    this.pane2.element.style.height = this.options.pane2Size;
                    //this.resizerElement.style.top = this.options.pane2Size;
                } else {
                    this.pane2.element.style.width = this.options.pane2Size;
                    //this.resizerElement.style.left = this.options.pane2Size;
                }
                this.resizerElement.style.display = 'none';
            } else {
                this.pane1.element.style.flexGrow = 1;
                this.pane2.element.style.flexGrow = 1;
                this.resizerElement.style.display = 'none';
            }
        }

        return this.element;
    }
}