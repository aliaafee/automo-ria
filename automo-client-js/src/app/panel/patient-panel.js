const moment = require('moment');

const Control = require('../../controls/control');
const Scrolled = require('../../controls/scrolled');
const Spinner = require('../../controls/spinner');
const ResourcePanel = require('../../controls/panel/resource-panel');
const PatientForm = require('../form/patient-form');
const AdmissionPanel = require('../panel/admission-panel')


class PatientBanner extends Control {
    constructor(options={}) {
        super(options)

        //this._fieldElements = {}
        this._fields = {
            'name': new Control(),
            'sex': new Control(),
            'age': new Control(),
            'national_id_no': new Control(),
            'hospital_no': new Control(),
            'phone_no': new Control()
        }
    }

    setValue(data) {
        for (const [key, field] of Object.entries(this._fields)) {
            if (data[key]) {
                field.setValue(data[key])
            }
        }
    }

    createElement() {
        super.createElement()

        this.element.className = 'patient-banner'

        var detailsElement = document.createElement('div');
        detailsElement.className = 'details'
        this.element.appendChild(detailsElement)

        ///this._fieldElements['name'] = document.createElement('h1');
        detailsElement.appendChild(this._fields['name'].createElement('h1'));

        //this._fieldElements['sex'] = document.createElement('span');
        detailsElement.appendChild(this._fields['sex'].createElement('span'));

        var slash = document.createTextNode(' / ')
        detailsElement.appendChild(slash)

        //this._fieldElements['age'] = document.createElement('span');
        detailsElement.appendChild(this._fields['age'].createElement('span'));

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

        //this._fieldElements['national_id_no'] = document.createElement('span');
        col1.appendChild(this._fields['national_id_no'].createElement('span'));

        //this._fieldElements['hospital_no'] = document.createElement('span');
        col2.appendChild(this._fields['hospital_no'].createElement('span'))

        //this._fieldElements['phone_no'] = document.createElement('span');
        col3.appendChild(this._fields['phone_no'].createElement('span'));

        return this.element
    }
}


module.exports = class PatientPanel extends Scrolled {
    constructor(options={}) {
        super(options)

        this.patient = null;

        this.patientBanner = new PatientBanner();

        this.patientDetails = new ResourcePanel(
            new PatientForm(),
            (patient) => {
                this.patientBanner.setValue(patient)
            },
            {
                title: "Patient Details",
                className: "patient-details"
            }
        )

        this.spinner = new Spinner();

        this.admissionPanel = new AdmissionPanel(
            {
                spinner: this.spinner
            }
        )
    }

    _setPatient(patient, onDone, admission) {
        this.patient = patient;

        this.patientBanner.setValue(this.patient)
        this.patientBanner.show()

        this._bodyElement.style.display = '';

        this.patientDetails.setValue(patient)
        this.patientDetails.show()

        
        this.admissionPanel.show()

        if (admission) {
            this.admissionPanel.setAdmission(admission)
            return
        }
        this.admissionPanel.setPatient(patient)
        
        onDone()
    }

    setPatient(patient, onDone, onFailed, admission) {
        this.patientBanner.setValue(patient)
        this.patientBanner.show()

        this.patientDetails.hide()
        this.patientDetails.collapse()

        this._bodyElement.style.display = 'none';
        this._errorElement.style.display = 'none';

        this.spinner.reset()
        this.spinner.show();
        connection.get(
            patient.url,
            patient => {
                this._setPatient(patient, onDone, admission)
            },
            (error) => {
                this._errorElement.style.display = ''
                onFailed();
                if (error.status == 404) {
                    this._errorElement.innerHTML = 'Patient Not Found'
                    return
                }
                this._errorElement.innerHTML = `Failed to load patient: ${error.message}`
            },
            () => {
                this.spinner.hideSoft();
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

        this._container.appendChild(this.patientDetails.createElement())
        this.patientDetails.collapse()

        this._bodyElement = document.createElement('div');
        this._bodyElement.className = 'body';
        this._container.appendChild(this._bodyElement);

        this._bodyElement.appendChild(this.admissionPanel.createElement())

        this._errorElement = document.createElement('div');
        this._errorElement.className = 'error';
        this._container.appendChild(this._errorElement);

        this.patientBanner.hide()
        this.patientDetails.hide()
        this._bodyElement.style.display = 'none';
        this._errorElement.style.display = 'none';
        
        return this.element;
    }

}