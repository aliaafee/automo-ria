const moment = require('moment');

const Control = require('../../controls/control');
const Scrolled = require('../../controls/scrolled');
const Tile =  require('../../controls/tile');
const ResourceAccordion = require('../../controls/resource-accordion');
const ResourceAccordionItem = require('../../controls/resource-accordion-item');
const AdmissionPanel = require('./admission-panel');
const Spinner = require('../../controls/spinner');


/*
class ProblemsTile extends Tile {
    constructor(options={}) {
        super('Diagnosis', options);

        this.resourceList = new ResourceAccordion(
            (item) => {
                return item.id;
            },
            ResourceAccordionItem
        );
    }

    setPatient(patient, onDone) {
        this.resourceList.setResourceUrl(patient.problems, onDone);
    }

    createElement() {
        super.createElement();

        this._tileBodyElement.appendChild(this.resourceList.createElement());

        return this.element
    }
}*/


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

/*
class CurrentAdmissionTile extends AdmissionsTile {
    constructor(label ,options={}) {
        super(label, options);

        this.resourceList = new ResourceAccordion(
            (item) => {
                return item.id;
            },
            AdmissionsItem
        );
    }

    setPatient(patient, onDone) {
        this.resourceList.setResourceUrl(patient.admissions_active, onDone);
    }

    createElement() {
        super.createElement();

        this._tileBodyElement.appendChild(this.resourceList.createElement());

        return this.element
    }
}*/


module.exports = class PatientPanel extends Scrolled {
    constructor(options={}) {
        super(options)

        this.patient = null;

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

        this._idNumberElement.innerHTML = "NIC No.: " + patient.national_id_no;
        this._hospNumberElement.innerHTML = "Hospital No.: " +patient.hospital_no;
        this._phoneNumberElement.innerHTML = "Phone No.: " +patient.phone_no;
        this._nameElement.innerHTML = patient.name;
        this._ageSexElement.innerHTML = patient.age + "/" + patient.sex;

        this._headerElement.style.display = 'flex';
        this._bodyElement.style.display = 'flex';

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
        this._idNumberElement.innerHTML = "NIC No.: " + patient.national_id_no;
        this._hospNumberElement.innerHTML = "Hospital No.: " +patient.hospital_no;
        this._phoneNumberElement.innerHTML = "";
        this._nameElement.innerHTML = patient.name;
        this._ageSexElement.innerHTML = patient.age + "/" + patient.sex;
        
        this._headerElement.style.display = 'flex';
        this._bodyElement.style.display = 'none';
        this._errorElement.style.display = 'none';

        this.spinner.show();
        connection.get(
            patient.url,
            patient => {
                this.spinner.hide();
                this._setPatient(patient, onDone)
            },
            (error) => {
                this.spinner.hide();
                console.log(error);
                this._errorElement.innerHTML = 'Failed to Load'
                this._errorElement.style.display = 'flex'
                onFailed();
            },
            () => {
                
            }
        )
    }

    createElement() {
        super.createElement();

        this.element.id = 'patient-panel';
        this.element.style.display = 'block';

        this.element.appendChild(this.spinner.createElement());
        this.spinner.hide();

        this._container = document.createElement('div');
        this._container.className = 'container';
        this.element.appendChild(this._container)

        this._headerElement = document.createElement('div');
        this._headerElement.className = 'header';
        this._headerElement.style.flexDirection = 'column';
        this._container.appendChild(this._headerElement);

        var detailsElement = document.createElement('div')
        detailsElement.style.display = 'flex';
        detailsElement.style.flexDirection = 'row';
        detailsElement.style.alignItems = 'baseline';
        this._headerElement.appendChild(detailsElement);

        this._nameElement = document.createElement('h1');
        detailsElement.appendChild(this._nameElement);

        this._ageSexElement = document.createElement('span');
        detailsElement.appendChild(this._ageSexElement);

        var numberElement = document.createElement('div');
        numberElement.className = 'number';
        numberElement.style.display = 'flex';
        this._headerElement.appendChild(numberElement);

        this._idNumberElement = document.createElement('div');
        numberElement.appendChild(this._idNumberElement);

        this._hospNumberElement = document.createElement('div');
        numberElement.appendChild(this._hospNumberElement);

        this._phoneNumberElement = document.createElement('div');
        numberElement.appendChild(this._phoneNumberElement);

        this._bodyElement = document.createElement('div');
        this._bodyElement.className = 'body';
        this._bodyElement.style.flexDirection = 'column';
        this._container.appendChild(this._bodyElement);

        

        this._bodyElement.appendChild(this.currentAdmissionTile.createElement());
        this._bodyElement.appendChild(this.admissionsTile.createElement());

        this._errorElement = document.createElement('div');
        this._errorElement.className = 'error';
        this._container.appendChild(this._errorElement);

        this._headerElement.style.display = 'none';
        this._bodyElement.style.display = 'none';
        this._errorElement.style.display = 'none';
        
        return this.element;
    }

}