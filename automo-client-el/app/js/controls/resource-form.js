const Form = require('./form');
const Button = require('./button');


class ResourceForm extends Form {
    constructor(elementId, name, connection, getUrl, postUrl, options = {}) {
        /* Supported options ...
         * title="Title of the form"
         */
        super(elementId, name, options);

        this.connection = connection;
        this.getUrl = getUrl;
        this.postUrl = postUrl;

        this.btnEdit = new Button(
            `${this.elementId}-edit`,
            `${this.name}-edit`,
            'Edit',
            () => {
                this.unlock();
                this.btnEdit.hide();
                this.btnCancel.show();
                this.btnSave.show();
            },
            {
                type: 'light',
                icon: 'edit'
            }
        );
        this.addButton(this.btnEdit);

        this.btnSave = new Button(
            `${this.elementId}-save`,
            `${this.name}-save`,
            'Save',
            () => {
                this.postData();
            },
            {
                type: 'dark',
                icon: 'save'
            }
        );
        this.addButton(this.btnSave);

        this.btnCancel = new Button(
            `${this.elementId}-cancel`,
            `${this.name}-cancel`,
            'Cancel',
            () => {
                this.lock();
                this.btnCancel.hide();
                this.btnSave.hide();
                this.clearValidation();
                this.getData();
            },
            {
                type: 'light',
                icon: 'x'
            }
        );
        this.addButton(this.btnCancel);
    }

    getData() {
        this._showSpinner();
        this.connection.get(
            this.getUrl,
            data => {
                this.val(data);
                this._hideSpinner();
            },
            error => {
                console.log(error);
                this._hideSpinner();
            }
        )


        this.btnEdit.show();
    }

    postData() {
        if (!this.validate()) {
            return
        }

        this._showSpinner();

        this.connection.post(
            this.postUrl,
            this.val(),
            () => {
                this._hideSpinner();
                this.lock();
                this.btnCancel.hide();
                this.btnSave.hide();
                this.getData();
            },
            (error) => {
                console.log(error);
                this._hideSpinner();
            }
        )
    }

    _showSpinner() {
        $(`#${this.elementId}-spinner`).html(`
            <div class="spinner-border spinner-border-sm" role="status">
            </div>
        `);
    }

    _hideSpinner() {
        $(`#${this.elementId}-spinner`).html("")
    }

    getHeaderHtml() {
        var title = super.getHeaderHtml();
        return `
            <div class="d-flex">
                <div class="flex-grow-1">
                    ${title}&nbsp;
                </div>
                <div>
                    <span id="${this.elementId}-spinner"></span>
                    <button id="${this.elementId}-edit"></button>
                    <span class="btn-group">
                        <button id="${this.elementId}-save"></button>
                        <button id="${this.elementId}-cancel"></button>
                    </span>
                </div>
            </div>
        `;
    }

    render(target) {
        super.render(target);

        this.lock();
        this.btnEdit.hide();
        this.btnCancel.hide();
        this.btnSave.hide();
    }
}


module.exports = ResourceForm;