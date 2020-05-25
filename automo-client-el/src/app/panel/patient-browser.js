const queryString = require('query-string');

const Control = require('../../controls/control');
const TextBox = require('../../controls/text-box');
//const ListBox = require('../../controls/list-box');
const ResourceList = require('../../controls/resource-list');
const Splitter = require('../../controls/splitter');



class PatientList extends Control {
    constructor(option={}) {
        super(option);

        this.searchBox = new TextBox();
        this.resultList = new ResourceList(
            (item) => {
                return item.id;
            },
            (item) => {
                return this._getPatientLabel(item);
            },
            (item) => {
                console.log(item);
            }
        )
    }

    _getPatientLabel(patient) {
        return `${patient.name}`
        return `
            <span class="patient-label">
                <span class="patient-id-number">
                    ${patient.national_id_no}
                </span>
                <span class="patient-name">
                    ${patient.name}
                </span>
                <span class="patient-age-sex">
                    ${patient.age} | ${patient.sex}
                </span>
            </span>
        `
    }

    _search() {
        this.resultList.setResourceUrl(
            connection.resource_index.patients + '?' + queryString.stringify(
                {
                    'q': this.searchBox.value()
                }
            )
        )
        /*
        connection.get(
            connection.index_url,
            data => {
                this.resultList.setResourceUrl(data.patients)
            },
            (error) => {
                console.log(error);
            },
            () => {
                console.log('clean up');
            }
        )
        */
    }

    createElement() {
        super.createElement();

        this.element.appendChild(this.searchBox.createElement());

        this.element.appendChild(this.resultList.createElement());

        this.element.style.display = 'flex';
        
        this.searchBox.element.addEventListener('keyup', (ev) => {
            this._search();
        })

        this._search();

        return this.element;
    }
}


module.exports = class PatientBrowser extends Splitter {
    constructor(options={}) {
        var patientList = new PatientList();
        var paitentView = new Control();

        options.pane1Size = '200px';
        options.resizable = true;

        super(
            patientList,
            paitentView,
            options
        )
    }

    createElement() {
        return super.createElement()
    }
};