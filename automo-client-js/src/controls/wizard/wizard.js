//const Control = require("./control");
const Dialog = require('../dialog/dialog');
const Button = require('../button')

module.exports = class Wizard extends Dialog {
    constructor(options) {
        /* Options
         *  
         */
        super(options);

        this.pages = []

        this._currentPage = 0

        this.btnBack = new Button(
            'Back',
            (event) => {
                this.onBack(event)
            }
        )

        this.btnNext = new Button(
            'Next',
            (event) => {
                this.onNext(event)
            }
        )

        this.btnSave = new Button(
            'Save',
            (event) => {
                this.onSave(event)
            }
        )
    }

    onNext() {
        var currentPage = this.getCurrentPage()

        //if (!currentPage.validate()) {
        //    return false
        //}

        this.gotoNextPage()
    }

    addPage(page) {
        this.pages.push(page);
    }

    gotoPage(page) {
        for (var i = 0; i < this.pages.length; i++) {
            if (i == page) {
                this.pages[i].show()
            } else {
                this.pages[i].hide()
            }
        }
        this._currentPage = page
    }

    gotoNextPage() {
        if (this._currentPage > this.pages.length) {
            return 
        }

        this.gotoPage(this._currentPage + 1)
    }

    getCurrentPage() {
        return this.pages[this._currentPage]
    }

    createElement() {
        super.createElement()

        this._dialogElement.classList.add("wizard")
        

        this.pages.forEach((page) => {
            this.bodyElement.appendChild(page.createElement());
        })

        var btns = [
            this.btnBack,
            this.btnNext,
            this.btnSave
        ]
        
        btns.forEach((button) => {
            this.footerElement.appendChild(button.createElement())
        })

        this.gotoPage(0)

        return this.element
    }
}