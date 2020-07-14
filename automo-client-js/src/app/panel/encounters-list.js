//const Button = require("../button");
const Spinner = require("../../controls/spinner");
const CollapsePanel = require("../../controls/panel/collapse-panel");
//const ResourcePanel = require("../../controls/panel/resource-panel")
const EncounterPanel = require("./encounter-panel")

module.exports = class EncountersList extends CollapsePanel {
    constructor (options={}) {
        super(options);

        this.spinner = new Spinner()

        this.encounters_data = null

        this._panels = []
    }

    setValue(value) {
        this.setEncounterListUrl(value['encounters_url'])
    }

    _clear() {
        while (this.encountersListElement.firstChild) {
            this.encountersListElement.firstChild.remove();
        }
        this._panels = []
    }

    _appendData(data) {
        if (data == null) {
            return
        }

        data.forEach((item) => {
            console.log(item.type)

            var panel = new EncounterPanel(
                () => {},
                {
                    type: item.type
                }
            )

            this.encountersListElement.appendChild(panel.createElement())

            panel.setTitle(item.label)
            panel.setValue(item)

            this._panels.push(panel)
        })
    }

    setEncounterListUrl(url) {
        this._clear()

        this.encountersUrl = url
        this.spinner.show()

        connection.get(
            this.encountersUrl,
            (response) => {
                console.log(response)
                this._appendData(response.items)
            },
            (error) => {
                if (error.status == 404) {
                    console.log("No encounters found")
                    return
                }
                console.log("Error loading encounters")
            },
            () => {
                this.spinner.hide()
            }
        )
    }

    createElement() {
        super.createElement()

        this.bodyElement.appendChild(this.spinner.createElement())

        this.encountersListElement = document.createElement('div')
        this.encountersListElement.className = 'encounters-list'
        this.bodyElement.appendChild(this.encountersListElement)

        this.spinner.hide()

        return this.element
    }
}