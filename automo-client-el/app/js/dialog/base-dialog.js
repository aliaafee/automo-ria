

class Dialog {
    constructor(name, canDismiss=true, fade=true, centered=false) {
        this.name = name;
        this.targetId = "#dialog"
        this.canDismiss = true;
        this.fade = true;
        this.centered = false;
        this.large = false;
    }

    show() {
        if ($(`#${this.name}`).length == 0) {
            this.render($(this.targetId));
        }
        if (this.canDismiss) {
            $(`#${this.name}`).modal("show");
            return;
        }
        $(`#${this.name}`).modal({backdrop: 'static', keyboard: false})
    }

    close(on_closed) {
        $(`#${this.name}`).modal("hide");
        if (!this.fade) {
            on_closed();
            return;
        }
        $(`#${this.name}`).on('hidden.bs.modal', () => {
            on_closed();
        });
    }

    _getCloseButton() {
        if (!this.canDismiss) {
            return "";
        }
        return `
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>`

    }

    getHeader() {
        return `
            <div class="modal-header">
                <h5 id="dialog-title" class="modal-title">Title</h5>
                ${this._getCloseButton()}
            </div>`
    }

    getBody() {
        return `
            <div id="dialog-body" class="modal-body">
                Body
            </div>`
    }

    getFooter() {
        return `
            <div id="dialog-footer" class="modal-footer">
                Footer
            </div>`
    }

    render(target) {
        target.html(`
        <div id="${this.name}" class="modal ${this.fade ? 'fade' : ''}" tabindex="-1" role="dialog">
            <div class="modal-dialog ${this.large ? 'modal-lg' : ''} ${this.centered ? 'modal-dialog-centered' :''}" role="document">
                <div class="modal-content">
                    ${this.getHeader()}
                    ${this.getBody()}
                    ${this.getFooter()}
                </div>
            </div>
        </div>`)
    }
}

module.exports = Dialog;