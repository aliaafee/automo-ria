//const queryString = require('query-string');
const querystring = require('querystring');

const Control = require('../../controls/control');
const TextBox = require('../../controls/text-box');
//const ListBox = require('../../controls/list-box');
const ResourceList = require('../../controls/resource-list');
const Splitter = require('../../controls/splitter');
const PatientPanel = require('./patient-panel');
const Button = require('../../controls/button')



class PatientList extends Control {
    constructor(options={}) {
        super(options);

        this.onSelectPatient = null;
        this.onSearchStarted = null;
        this.onDismissSearch = null;

        this.searchBox = new TextBox({
            placeholder: 'Search'
        });

        this.btnDismiss = new Button(
            'Close Search',
            () => {
                this.searchBox.setValue("")
                this.onDismissSearch()
            },
            {
                icon: 'x'
            }
        )

        this.resultList = new ResourceList(
            (item) => {
                return item.id;
            },
            (item) => {
                return this._getPatientLabel(item);
            },
            (item) => {
                this.onSelectPatient(item);
            },
            {
                autoLoadNext: true,
                cache: false
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
        if (this.onSearchStarted) {
            this.onSearchStarted();
        }
        this.resultList.setResourceUrl(
            connection.resource_index.patients + '?' + querystring.stringify(
                {
                    'q': this.searchBox.value(),
                    'per_page': 30
                }
            )
        )
    }

    lock() {
        this.resultList.lock()
    }

    unlock() {
        this.resultList.unlock();
    }

    createElement() {
        super.createElement();

        this.element.id = 'patient-list'

        var toolbarElement = document.createElement('div')
        toolbarElement.className = 'toolbar'
        this.element.appendChild(toolbarElement)

        toolbarElement.appendChild(this.searchBox.createElement());
        this.searchBox.element.setAttribute('autocomplete', 'off')

        toolbarElement.appendChild(this.btnDismiss.createElement());

        this.element.appendChild(this.resultList.createElement());
        
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
        var patientList = new PatientList();

        options.pane1Size = '260px';
        
        options.resizable = true;

        super(
            patientList,
            patientPanel,
            options
        )

        patientList.onSelectPatient = (patient) => {
            patientList.lock();
            this.setPane2Active();
            patientPanel.setPatient(
                patient, 
                () => {
                    patientList.unlock();
                },
                () => {
                    patientList.unlock();
                }
            );
        }

        patientList.onSearchStarted = () => {
            this.setPane1Active()
        }

        patientList.onDismissSearch = () => {
            this.setPane2Active()
        }
    }

    setPatient(patient, onDone, onFailed, admission) {
        this.pane2.setPatient(patient, onDone, onFailed, admission)
    }

    createElement() {
        super.createElement()

        this.element.id = 'patient-browser'

        return this.element
    }
};