const moment = require('moment');

const Control = require("../../controls/control");
const Button = require('../../controls/button')
const ResourcePanel = require('../../controls/panel/resource-panel');

const Form = require("../../controls/form/form")
const PatientForm = require('../form/patient-form')
const AdmissionDetailsForm = require('../form/admission-details-form')
const ProblemsForm = require('../form/problems-form')
const AdmissionNotesForm = require('../form/admission-notes-form')
const DischargeNotesForm = require('../form/discharge-notes-form')

class AdmissionsList extends Control {
    constructor(options={}) {
        options.className = 'admissions-list'
        super(options)

        this.nextButton = new Button(
            `<span class="arrow right"></span>`,
            () => {
                this._onNext()
            },
            {
                style: 'clear'
            }
        )

        this.prevButton = new Button(
            `<span class="arrow left"></span>`,
            () => {
                this._onPrev()
            },
            {
                style: 'clear'
            }
        )

    }

    setAdmission(admission) {
        var from = ''
        if (admission.start_time) {
            from = moment(admission.start_time).format('LL')
        }

        var to = 'Current'
        if (admission.end_time) {
            to = moment(admission.end_time).format('LL')
        }

        this.labelElement.innerHTML = `
            <h1>Admission</h1>
            <div>${from} to ${to} </div>
            <div>${admission.personnel.complete_name}</div>
            <div>${admission.personnel.department.name}</div>
        `
    }

    createElement() {
        super.createElement()

        this.element.appendChild(this.prevButton.createElement())

        this.labelElement = document.createElement('div')
        this.labelElement.className = 'label'
        this.element.appendChild(this.labelElement)

        this.element.appendChild(this.nextButton.createElement())

        return this.element
    }
}

module.exports = class AdmissionPanel extends Control {
    constructor (options={}) {
        options.id = 'admission-panel'
        super(options);

        this.admissionList = new AdmissionsList()
        
        this._panels = []

        this._panels.push(
            new ResourcePanel(
                new AdmissionDetailsForm(),
                (admission) => {
                    this.admissionList.setAdmission(admission)
                },
                {
                    title: 'Admission Details'
                }
            )
        )

        this._panels.push(
            new ResourcePanel(
                new ProblemsForm(),
                null,
                {
                    title: 'Diagnosis'
                }
            )
        )

        this._panels.push(
            new ResourcePanel(
                new AdmissionNotesForm(),
                null,
                {
                    title: 'Admission Notes'
                }
            )
        )

        this._panels.push(
            new ResourcePanel(
                new Form(),
                null,
                {
                    title: 'Investigations'
                }
            )
        )

        this._panels.push(
            new ResourcePanel(
                new Form(),
                null,
                {
                    title: 'Procedures/ Reports/ Other Notes'
                }
            )
        )

        this._panels.push(
            new ResourcePanel(
                new DischargeNotesForm(),
                null,
                {
                    title: 'Discharge Notes'
                }
            )
        )

        this._panels.push(
            new ResourcePanel(
                new Form(),
                null,
                {
                    title: 'Discharge Prescription'
                }
            )
        )
    }

    createElement() {
        super.createElement();

        this.element.appendChild(this.admissionList.createElement())

        this._panels.forEach((panel) => {
            this.element.appendChild(panel.createElement())
        })

        return this.element
    }

    setAdmission(admission) {
        this.admissionList.setAdmission(admission)
        
        connection.get(
            admission.url,
            (admission) => {
                console.log(admission)
                this._panels.forEach((panel) => {
                    panel.setValue(admission)
                })
            },
            (error) => {
                console.log(error)
            },
            () => {
                console.log("finally")
            }
        )
    }

    setPatient(patient) {
        console.log(patient)

        connection.get(
            patient.admissions,
            (admissions) => {
                console.log(admissions)
                if (admissions) {
                    this.setAdmission(admissions.items[1])
                } else {
                    this.admissionList.hide()
                    console.log("Not Admissions Found")
                }
            },
            (error) => {
                console.log(error)
            },
            () => {
                console.log("Finally")
            }
        )
    }
}
