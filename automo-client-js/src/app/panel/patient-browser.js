//const queryString = require('query-string');
const querystring = require('querystring');

const Control = require('../../controls/control');
const TextBox = require('../../controls/text-box');
//const ListBox = require('../../controls/list-box');
const ResourceList = require('../../controls/resource-list');
const Splitter = require('../../controls/splitter');
const PatientPanel = require('./patient-panel');



class PatientList extends Control {
    constructor(onSelectPatient, option={}) {
        super(option);

        this.searchBox = new TextBox({
            placeholder: 'Search'
        });
        this.resultList = new ResourceList(
            (item) => {
                return item.id;
            },
            (item) => {
                return this._getPatientLabel(item);
            },
            (item) => {
                onSelectPatient(item);
            }
        )
    }

    _getPatientLabel(patient) {
        return `
            <div class="patient-label">
                <div class="patient-id-number">
                    ${patient.national_id_no}
                </div>
                <div class="patient-name">
                    ${patient.name}
                </div>
                <div class="patient-age">
                    ${patient.age}
                </div>
                <div class="patient-sex">
                    ${patient.sex}
                </div>
            </div>
        `
    }

    _search() {
        this.resultList.setResourceUrl(
            connection.resource_index.patients + '?' + querystring.stringify(
                {
                    'q': this.searchBox.value()
                }
            )
        )
    }

    createElement() {
        super.createElement();

        this.element.className = 'patient-list';

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
        var patientPanel = new PatientPanel();
        var patientList = new PatientList((patient) => {
            patientPanel.setPatient(patient);
        });

        options.pane1Size = '260px';
        options.resizable = true;

        super(
            patientList,
            patientPanel,
            options
        )
    }

    createElement() {
        return super.createElement()
    }
};