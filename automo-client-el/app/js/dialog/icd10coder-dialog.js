const feather = require('feather-icons');
const Dialog = require("./base-dialog");


class ICD10Dialog extends Dialog {
    constructor() {
        super("icd10-dialog");
        this.large = true;
    }

    getHeader() {
        return `
            <div class="modal-header">
                <div class="input-group mb-2">
                    <div class="input-group-prepend">
                        <div class="input-group-text">${feather.icons['search'].toSvg()}</div>
                    </div>
                    <input type="text" class="form-control" id="inlineFormInputGroup" placeholder="Search ICD10 Codes">
                </div>
                ${this._getCloseButton()}
            </div>`
    }


}

module.exports = ICD10Dialog;