//const Control = require("./control");
const Dialog = require('../dialog/dialog');
const Button = require('../button')
const StatusDialog = require('../dialog/status-dialog')

module.exports = class Wizard extends Dialog {
    constructor(options) {
        /* Options
         *  
         */
        options.groupButtons = true;
        super(options);

        this.pages = []

        this.afterSave =

        this._currentPage = 0

        this.btnBack = new Button(
            'Back',
            (event) => {
                this._onBack(event)
            }
        )

        this.btnNext = new Button(
            'Next',
            (event) => {
                this._onNext(event)
            }
        )

        this.btnSave = new Button(
            'Save',
            (event) => {
                this._onSave(event)
            },
            {
                style: 'primary'
            }
        )
    }

    value() {
        var result = {}
        this.pages.forEach((page) => {
            var page_value = page.value()
            if (page_value) {
                result = Object.assign(result,page_value)
            }
        })
        return result
    }

    show(afterSave, onCancel) {
        this.afterSave = afterSave
        super.show(onCancel);
    }

    _onNext() {
        var currentPage = this.getCurrentPage()

        if (!currentPage.validate()) {
            var statusDialog = new StatusDialog()
            statusDialog.show(
                'Invalid Fields',
                'Some fields contain invalid values'
            )
            return false
        }

        this.gotoNextPage()
    }

    _onBack() {
        this.gotoPreviousPage()
    }

    _onSave() {
        /*
        var currentPage = this.getCurrentPage()

        if (!currentPage.validate()) {
            console.log("Invalid input")
            return false
        }*/

        this.onSave(this.value())
    }

    onSave(data) {
        this.afterSave(data)
    }

    addPage(page) {
        this.pages.push(page);
    }

    gotoPage(page) {
        for (var i = 0; i < this.pages.length; i++) {
            this.pages[i].hide()
        }

        this._currentPage = page
        this.pages[this._currentPage].show(this)

        if (this._currentPage == 0) {
            this.btnBack.lock()
        } else {
            this.btnBack.unlock()
        }

        if (this._currentPage == this.pages.length - 1) {
            this.btnNext.lock()
            this.btnSave.unlock()
        } else {
            this.btnNext.unlock()
            this.btnSave.lock()
        }
    }

    gotoNextPage() {
        if (this._currentPage >= this.pages.length - 1) {
            return 
        }

        this.gotoPage(this._currentPage + 1)
    }

    gotoPreviousPage() {
        if (this._currentPage < 1) {
            return 
        }

        this.gotoPage(this._currentPage - 1)
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