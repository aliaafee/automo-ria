const moment = require('moment');

const Control = require('../../controls/control');
const Scrolled = require('../../controls/scrolled');
const Tile =  require('../../controls/tile');
const ResourceAccordion = require('../../controls/resource-accordion');
const ResourceAccordionItem = require('../../controls/resource-accordion-item');
const AdmissionPanel = require('./admission-panel');
const Spinner = require('../../controls/spinner');


class AdmissionItem extends ResourceAccordionItem {
    constructor(itemData, options={}) {
        super(itemData, options);

        this.admission_panel = new AdmissionPanel();
    }

    displayResource() {
        this.admission_panel.setData(this.resourceData);
    }

    createHeaderElement() {
        super.createHeaderElement();

        this.headerElement.innerHTML = `
            <div class="doctor">
                ${this.itemData.personnel.name}
            </div>
            <div class="date">
                <span>${moment(this.itemData.start_time).format('D MMM YYYY')}</span>
                to
                <span>${moment(this.itemData.end_time).format('D MMM YYYY')}</span>
            </div>
            <div class="duration">
                (${moment(this.itemData.end_time).diff(this.itemData.start_time, 'days')} days)
            </div>
        `;

        return this.headerElement;
    }

    createBodyElement() {
        super.createBodyElement();

        this.bodyElement.appendChild(this.admission_panel.createElement());

        return this.bodyElement;
    }

    createElement() {
        super.createElement()

        this.element.classList.add('admission-item');

        return this.element
    }
}

class CurrentAdmissionTile extends AdmissionItem {
    constructor(itemData, options={}) {
        super(itemData, options);
    }

    createHeaderElement() {
        super.createHeaderElement();

        this.headerElement.innerHTML = `
            <div class="doctor">
                ${this.itemData.personnel.name}
            </div>
            <div class="date">
                Admitted on 
                <span>${moment(this.itemData.start_time).format('D MMM YYYY')}</span>
            </div>
        `;

        return this.headerElement;
    }
}


class AdmissionsTile extends Tile {
    constructor(label ,options={}) {
        /* options
         *    admissionsType=admissions|admissions_active|admissions_previous
         *    itemClass=AdmissionsItem|AdmissionsActiveItem
         *
         */
        super(label, options);

        this.admissionsType = 'admissions'
        if (options.admissionsType != null) {
            this.admissionsType = options.admissionsType;
        }

        this.itemClass = AdmissionItem;
        if (options.itemClass != null) {
            this.itemClass = options.itemClass;
        }

        this.resourceList = new ResourceAccordion(
            (item) => {
                return item.id;
            },
            this.itemClass
        );
    }

    setPatient(patient, onDone) {
        this.show();
        this.resourceList.setResourceUrl(
            patient[this.admissionsType],
            onDone,
            (error) => {
                if (error.status == 404) {
                    this.hide()
                }
                onDone();
            }
        );
    }

    createElement() {
        super.createElement();

        this._tileBodyElement.appendChild(this.resourceList.createElement());

        return this.element
    }
}

class PatientBanner extends Control {
    constructor(options={}) {
        super(options)

        this._fieldElements = {}
    }

    setValue(data) {
        for (const [key, elem] of Object.entries(this._fieldElements)) {
            if (data[key]) {
                elem.innerHTML = data[key]
            }
        }
    }

    createElement() {
        super.createElement()

        this.element.className = 'patient-banner'

        var detailsElement = document.createElement('div');
        detailsElement.className = 'details'
        this.element.appendChild(detailsElement)

        this._fieldElements['name'] = document.createElement('h1');
        detailsElement.appendChild(this._fieldElements['name']);

        this._fieldElements['age'] = document.createElement('span');
        detailsElement.appendChild(this._fieldElements['age']);

        var slash = document.createTextNode(' / ')
        detailsElement.appendChild(slash)

        this._fieldElements['sex'] = document.createElement('span');
        detailsElement.appendChild(this._fieldElements['sex']);

        var numberElement = document.createElement('div');
        numberElement.className = 'number';
        this.element.appendChild(numberElement);

        var col1 = document.createElement('div')
        col1.innerHTML = "NIC No.: "
        numberElement.appendChild(col1)
        var col2 = document.createElement('div')
        col2.innerHTML = "Hosp No.: "
        numberElement.appendChild(col2)
        var col3 = document.createElement('div')
        col3.innerHTML = "Phone No.: "
        numberElement.appendChild(col3)

        this._fieldElements['national_id_no'] = document.createElement('span');
        col1.appendChild(this._fieldElements['national_id_no']);

        this._fieldElements['hospital_no'] = document.createElement('span');
        col2.appendChild(this._fieldElements['hospital_no'])

        this._fieldElements['phone_no'] = document.createElement('span');
        col3.appendChild(this._fieldElements['phone_no']);

        return this.element
    }
}


module.exports = class PatientPanel extends Scrolled {
    constructor(options={}) {
        super(options)

        this.patient = null;

        this.patientBanner = new PatientBanner();

        this.currentAdmissionTile = new AdmissionsTile(
            'Current Admission',
            {
                admissionsType: 'admissions_active',
                itemClass: CurrentAdmissionTile
            }
        );

        this.admissionsTile = new AdmissionsTile(
            'Previous Admissions',
            {
                admissionsType: 'admissions_previous'
            }
        );

        this.spinner = new Spinner();
    }

    _setPatient(patient, onDone) {
        this.patient = patient;

        this.patientBanner.setValue(this.patient)
        this.patientBanner.show()

        this._bodyElement.style.display = '';

        var processes = 2;
        var setPatientDone = () => {
            processes -= 1;
            if (processes < 1) {
                onDone();
            }
        }

        this.currentAdmissionTile.setPatient(patient, setPatientDone);
        this.admissionsTile.setPatient(patient, setPatientDone);
    }

    setPatient(patient, onDone, onFailed) {
        this.patientBanner.setValue(patient)
        this.patientBanner.show()

        this._bodyElement.style.display = 'none';
        this._errorElement.style.display = 'none';

        this.spinner.show();
        connection.get(
            patient.url,
            patient => {
                this.spinner.hideSoft();
                this._setPatient(patient, onDone)
            },
            (error) => {
                this.spinner.hideSoft();
                console.log(error);
                this._errorElement.innerHTML = 'Failed to Load'
                this._errorElement.style.display = ''
                onFailed();
            },
            () => {
                
            }
        )
    }

    createElement() {
        super.createElement();

        this.element.id = 'patient-panel';

        this.element.appendChild(this.spinner.createElement());
        this.spinner.hideSoft();

        this._container = document.createElement('div');
        this._container.className = 'container';
        this.element.appendChild(this._container)

        this._container.appendChild(this.patientBanner.createElement())

        this._bodyElement = document.createElement('div');
        this._bodyElement.className = 'body';
        this._container.appendChild(this._bodyElement);

        this._bodyElement.appendChild(this.currentAdmissionTile.createElement());
        this._bodyElement.appendChild(this.admissionsTile.createElement());

        this._errorElement = document.createElement('div');
        this._errorElement.className = 'error';
        this._container.appendChild(this._errorElement);

        this.patientBanner.hide()
        this._bodyElement.style.display = 'none';
        this._errorElement.style.display = 'none';
        
        return this.element;
    }

}