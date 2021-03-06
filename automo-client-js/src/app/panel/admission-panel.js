//const moment = require('moment');
const datetime = require('../../controls/datetime');

const Control = require("../../controls/control");
const Button = require('../../controls/button')
const ResourcePanel = require('../../controls/panel/resource-panel')
const ResourceListPanel = require("../../controls/panel/resource-list-panel")
const Spinner = require('../../controls/spinner')

const AdmissionDetailsForm = require('../form/admission-details-form')
const ProblemsForm = require('../form/problems-form')
const AdmissionNotesForm = require('../form/admission-notes-form')
const DischargeNotesForm = require('../form/discharge-notes-form')
const PrescriptionForm = require('../form/prescription-form')
const EncounterListPanel = require('./encounter-list-panel')
const EncounterListForm = require('../form/encounter-list-form')

class AdmissionsList extends Control {
    constructor(options={}) {
        options.className = 'admissions-list'
        super(options)

        this.onChangeAdmissionUrl = null
        this._admission = null

        this.nextButton = new Button(
            "",
            () => {
                this._onNext()
            },
            {
                style: 'clear',
                icon: 'arrow-right'
            }
        )

        this.prevButton = new Button(
            "",
            () => {
                this._onPrev()
            },
            {
                style: 'clear',
                icon: 'arrow-left'
            }
        )

    }

    _onPrev() {
        if (!this._admission) {
            return
        }

        if (!this._admission.prev) {
            return
        }

        if (!this.onChangeAdmissionUrl) {
            return
        }

        this.onChangeAdmissionUrl(this._admission.prev)
    }

    _onNext() {
        if (!this._admission) {
            return
        }

        if (!this._admission.next) {
            return
        }

        if (!this.onChangeAdmissionUrl) {
            return
        }

        this.onChangeAdmissionUrl(this._admission.next)
    }

    setError(message) {
        this.labelElement.innerText = message
    }

    setAdmission(admission) {
        this._admission = admission

        if (!admission) {
            //this.prevCountElement.innerText = ""
            //this.nextCountElement.innerText = ""
            this.prevButton.hideSoft()
            this.nextButton.hideSoft()
            this.labelElement.innerText = "No Admissions"
            return
        }

        this.labelElement.innerText = ""

        var from = ''
        if (admission.start_time) {
            //from = moment.utc(admission.start_time, 'YYYY-MM-DD').format('LL')
            from = datetime.toLocalDateFormatted(admission.start_time)
        }

        var to = 'Current'
        if (admission.end_time) {
            //to = moment.utc(admission.end_time, 'YYYY-MM-DD').format('LL')
            to = datetime.toLocalDateFormatted(admission.end_time)
        }

        let titleElement = document.createElement('h1')
        titleElement.innerText = "Admission"
        this.labelElement.appendChild(titleElement)
        this.labelElement.append(
            ...[
                `${from} to ${to}`,
                admission.personnel.complete_name,
                admission.personnel.department.name
            ].map((label) => {
                let elem = document.createElement('div')
                elem.innerText = label;
                return elem
            })
        )

        if (admission.prev) {
            this.prevButton.show()
            this.prevButton.setTitle(`${admission.prev_count} Previous Admission(s)`)
            this.prevButton.setLabel(admission.prev_count)
            //this.prevCountElement.innerText = admission.prev_count
        } else {
            this.prevButton.hideSoft()
            //this.prevCountElement.innerText = ""
        }

        if (admission.next) {
            this.nextButton.show()
            this.nextButton.setTitle(`${admission.next_count} Admission(s) Ahead`)
            this.nextButton.setLabel(admission.next_count)
            //this.nextCountElement.innerText = admission.next_count
        } else {
            this.nextButton.hideSoft()
            //this.nextCountElement.innerText = ""
        }
    }

    createElement() {
        super.createElement()

        this.element.appendChild(this.prevButton.createElement())

        //this.prevCountElement = document.createElement('span')
        //this.prevButton.element.appendChild(this.prevCountElement)

        this.labelElement = document.createElement('div')
        this.labelElement.className = 'label'
        this.element.appendChild(this.labelElement)

        this.element.appendChild(this.nextButton.createElement())

        //this.nextCountElement = document.createElement('span')
        //this.nextButton.element.prepend(this.nextCountElement)

        this.prevButton.hideSoft()
        this.nextButton.hideSoft()

        return this.element
    }
}

module.exports = class AdmissionPanel extends Control {
    constructor (options={}) {
        /* options
         *    spinner = spinner object
         */
        options.id = 'admission-panel'
        super(options);

        this._admission = null;

        this.admissionList = new AdmissionsList()

        this.admissionList.onChangeAdmissionUrl = (admission_url) => {
            this.admissionList.lock()
            this.setAdmissionUrl(admission_url)
        }

        this.btnDischargeSummary = new Button(
            'Discharge Summary',
            () => {
                connection.get_blob(
                    this._admission.discharge_summary_pdf,
                    (blob) => {
                        var file = window.URL.createObjectURL(blob);
                        window.open(file);
                    },
                    () => {
                        console.log('Failed to get discharge summary')
                    }
                )
            },
            {
                icon: 'printer'
            }
        )
        
        this._panels = []

        if (this.options.spinner) {
            this.spinner = this.options.spinner
        } else {
            this.spinner = new Spinner()
        }

        this._panels.push(
            new ResourcePanel(
                new AdmissionDetailsForm(),
                (admission) => {
                    /*this.admissionList.setAdmission(admission)*/
                    this.setAdmission(admission)
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
            new ResourceListPanel(
                new EncounterListForm (
                    {
                        resourceTypes: [
                            'imaging',
                            'endoscopy',
                            'histopathology',
                            'otherreport',
                            'completebloodcount',
                            'renalfunctiontest',
                            'othertest'
                        ]
                    }
                ),
                'encounters_url',
                {
                    title: 'Investigations'
                }
            )
        )

        this._panels.push(
            new ResourceListPanel(
                new EncounterListForm (
                    {
                        resourceTypes: [
                            'surgicalprocedure'
                        ]
                    }
                ),
                'encounters_url',
                {
                    title: 'Procedure Notes'
                }
            )
        )

        this._panels.push(
            new ResourceListPanel(
                new EncounterListForm (
                    {
                        resourceTypes: [
                            'vitalsigns',
                            'measurements',
                            'progress',
                            //'vitalsignsextended'
                        ]
                    }
                ),
                'encounters_url',
                {
                    title: 'Progress Notes'
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
                new PrescriptionForm(),
                null,
                {
                    title: 'Discharge Prescription'
                }
            )
        )
    }

    setAdmission(admission) {
        this.admissionList.setAdmission(admission)
        this.admissionList.unlock()
        
        this.setAdmissionUrl(admission.url)
    }

    setAdmissionUrl(admission_url) {
        this.spinner.show()
        this._bodyElement.style.display = ''
        this._bodyElement.classList.add('locked')

        connection.get(
            admission_url,
            (admission) => {
                this._admission = admission

                if (this._admission.discharge_summary_pdf) {
                    this.btnDischargeSummary.unlock()
                } else {
                    this.btnDischargeSummary.lock()
                }

                this._panels.forEach((panel) => {
                    panel.setValue(admission)
                    panel.expand()
                })
                this._bodyElement.classList.remove('locked')

                this.admissionList.setAdmission(admission)
                this.admissionList.unlock()
            },
            (error) => {
                this._bodyElement.style.display = 'none'
                this.admissionList.setAdmission(null)
                if (error.status == 404) {
                    this.admissionList.setError(`Admission Not Found`)
                    return
                }
                this.admissionList.setError(`Failed to load admissions: ${error.message}`)
            },
            () => {
                this.spinner.hideSoft()
            }
        )
    }

    setPatient(patient) {
        this.spinner.show()
        this.admissionList.lock()
        this._bodyElement.style.display = ''
        this._bodyElement.classList.add('locked')

        connection.get(
            patient.admissions,
            (admissions) => {
                if (admissions) {
                    this.setAdmission(admissions.items[0])
                } else {
                    this._bodyElement.style.display = 'none'
                    this.admissionList.setAdmission(null)
                }
            },
            (error) => {
                this._bodyElement.style.display = 'none'
                this.admissionList.setAdmission(null)
                if (error.status == 404) {
                    this.admissionList.setError(`No Admissions`)
                    return
                }
                this.admissionList.setError(`Failed to load admissions: ${error.message}`)
            },
            () => {
                this.admissionList.unlock()
                this.spinner.hideSoft()
            }
        )
    }

    createElement() {
        super.createElement();

        this.element.appendChild(this.admissionList.createElement())

        if (!this.options.spinner) {
            this.element.appendChild(this.spinner.createElement())
        }

        this._bodyElement = document.createElement('div')
        this._bodyElement.className = 'body'
        this.element.appendChild(this._bodyElement)

        this._toolbarElement = document.createElement('div')
        this._toolbarElement.className = "toolbar"
        this._bodyElement.appendChild(this._toolbarElement)

        this._toolbarElement.appendChild(this.btnDischargeSummary.createElement())

        this._panels.forEach((panel) => {
            this._bodyElement.appendChild(panel.createElement())
        })

        this._bodyElement.classList.add('locked')

        return this.element
    }
}
