const Wizard = require('../../controls/wizard/wizard')
const WizardPage = require('../../controls/wizard/wizard-page')
const WizardForm = require('../../controls/wizard/wizard-form')
const ResourceSearchBox = require('../../controls/resource-search-box')

const PatientForm = require('../form/patient-form')
const AdmissionDetailsForm = require('../form/admission-details-form')
const ProblemsForm = require('../form/problems-form')
const AdmissionNotesForm = require('../form/admission-notes-form')
const DischargeNotesForm = require('../form/discharge-notes-form')
const PrescriptionForm = require('../form/prescription-form')
const EncounterListForm = require("../form/encounter-list-form")

const StatusDialog = require("../../controls/dialog/status-dialog")


class PatientPage extends WizardForm {
    constructor(options = {}) {
        options.title = "Patient Details"

        super(new PatientForm(), options)

        this._selectedPatient = null;

        this._searchBox = new ResourceSearchBox(
            (item) => {
                return item.id
            },
            (item) => {
                return document.createTextNode(`${item.name} (${item.national_id_no})`)
            },
            (item) => {
                this._selectedPatient = item
                if (!item) {
                    this.form.clear()
                    this.form.unlock()
                    return
                }
                this.form.setValue(item)
                this.form.lock()
                this._loadPatient()
            },
            {
                placeholder: 'Select Patient',
                displaySelected: true,
                displayNull: true,
                nullLabel: '[New Patient]',
                resourceName: 'patients',
                popupHeight: '50%'
            }
        )
    }

    _loadPatient() {
        if (!this._selectedPatient) {
            return
        }

        connection.get(
            this._selectedPatient.url,
            (patient) => {
                this.form.setValue(patient)
            }
        )
    }

    validate() {
        if (this._selectedPatient) {
            return true
        }
        return super.validate()
    }

    value() {
        if (this._selectedPatient) {
            return this._selectedPatient
        }
        return super.value()
    }

    setValue(value) {
        if (!value) {
            this._selectedPatient = null
            this.form.setValue(null)
            this.form.unlock()
            return
        }

        if ("id" in value) {
            this._selectedPatient = value
            this._searchBox.setValue(value)
            this.form.setValue(value)
            this.form.lock()
            this._loadPatient()
            return
        }
        
        this._selectedPatient = null
        this.form.setValue(value)
        this.form.unlock()
    }

    show() {
        super.show()
        this.form.lock()
        //Need to call unlock on form for proper sizing or
        //growing of text boxes
        if (!this._selectedPatient) {
            this.form.unlock()
        }
    }

    createElement() {
        super.createElement()
        
        this.element.prepend(this._searchBox.createElement())
        this._searchBox._textBox.element.tabIndex = -1

        this._searchBox.setValue(null)

        return this.element
    }
}


class AdmissionDetails extends WizardForm {
    constructor(options = {}) {
        options.title = "Admission Details"
        super(new AdmissionDetailsForm(), options)
    }
}


class Problems extends WizardForm {
    constructor(options = {}) {
        options.title = "Diagnosis"
        super(new ProblemsForm(), options)
    }

    value() {
        return super.value()
    }
}


class AdmissionNotes extends WizardForm {
    constructor(options = {}) {
        options.title = "Admission Notes"
        super(new AdmissionNotesForm(), options)        
    }
}


class Encounters extends WizardForm {
    constructor(options = {}) {
        super(
            new EncounterListForm({
                resourceTypes: options.resourceTypes
            }),
            options
        )
    }
}

class DischargeNotes extends WizardForm {
    constructor(options = {}) {
        options.title = "Discharge Notes"
        super(new DischargeNotesForm(), options)

    }
}

class Prescription extends WizardForm {
    constructor(options = {}) {
        options.title = "Discharge Prescription"
        super(new PrescriptionForm(), options)
    }
}

class ReviewPage extends WizardPage {
    constructor(options = {}) {
        options.title = "Review Admission"
        super(options)

        this.newPatient = new PatientForm({title: "Patient Details"})
        this.admissionDetails = new AdmissionDetailsForm({title: "Admission Details"})
        this.problems = new ProblemsForm({title: "Diagnosis"})
        this.admissionNotes = new AdmissionNotesForm({title: "Admission Notes"})
        this.investigations = new EncounterListForm({title: "Investigations", resourceTypes: [
            'imaging',
            'endoscopy',
            'histopathology',
            'otherreport',
            'completebloodcount',
            'renalfunctiontest',
            'othertest'
        ]})
        this.procedures = new EncounterListForm({title: "Procedure Notes", resourceTypes: [
            'surgicalprocedure'
        ]})
        this.progress = new EncounterListForm({title: "Progress Notes", resourceTypes: [
            'vitalsigns',
            'measurements',
            'progress',
        ]})
        this.dischargeNotes = new DischargeNotesForm({title: "Discharge Prescription"})
        this.prescription = new PrescriptionForm({title: "Prescription"})
    }

    show(wizard) {
        super.show(wizard)

        this.newPatient.setValue(wizard.newPatient.value())
        this.admissionDetails.setValue(wizard.admissionDetails.value())
        this.problems.setValue(wizard.problems.value())
        this.admissionNotes.setValue(wizard.admissionNotes.value())
        this.investigations.setValue(wizard.investigations.value())
        this.procedures.setValue(wizard.procedures.value())
        this.progress.setValue(wizard.progress.value())
        this.dischargeNotes.setValue(wizard.dischargeNotes.value())
        this.prescription.setValue(wizard.prescription.value())

        this.newPatient.lock()
        this.admissionDetails.lock()
        this.problems.lock()
        this.admissionNotes.lock()
        this.investigations.lockAll()
        this.procedures.lockAll()
        this.progress.lockAll()
        this.dischargeNotes.lock()
        this.prescription.lock()
    }

    createElement() {
        super.createElement()

        this.element.appendChild(this.newPatient.createElement())
        this.element.appendChild(this.admissionDetails.createElement())
        this.element.appendChild(this.problems.createElement())
        this.element.appendChild(this.admissionNotes.createElement())
        this.element.appendChild(this.investigations.createElement())
        this.element.appendChild(this.procedures.createElement())
        this.element.appendChild(this.progress.createElement())
        this.element.appendChild(this.dischargeNotes.createElement())
        this.element.appendChild(this.prescription.createElement())

        return this.element
    }
}

module.exports = class AdmissionWizard extends Wizard {
    constructor(options) {
        super(options)

        this.newPatient = new PatientPage()
        this.admissionDetails = new AdmissionDetails()
        this.problems = new Problems()
        this.admissionNotes = new AdmissionNotes()
        
        this.investigations = new Encounters(
            {
                title: 'Investigations',
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
        )

        this.procedures = new Encounters(
            {
                title: 'Procedure Notes',
                resourceTypes: [
                    'surgicalprocedure'
                ]
            }
        )

        this.progress = new Encounters(
            {
                title: 'Progress Notes',
                resourceTypes: [
                    'vitalsigns',
                    'measurements',
                    'progress',
                ]
            }
        )

        this.dischargeNotes = new DischargeNotes()
        this.prescription = new Prescription()
        this.reviewPage = new ReviewPage()

        this.addPage(this.newPatient)
        this.addPage(this.admissionDetails)
        this.addPage(this.problems)
        this.addPage(this.admissionNotes)
        this.addPage(this.investigations)
        this.addPage(this.procedures)
        this.addPage(this.progress)
        this.addPage(this.dischargeNotes)
        this.addPage(this.prescription)
        this.addPage(this.reviewPage)
    }

    value() {
        var admission = Object.assign(
            {},
            this.admissionDetails.value(),
            this.admissionNotes.value(),
            this.dischargeNotes.value(),
        )

        if (admission.initial_vitalsigns) {
            admission.initial_vitalsigns.start_time = admission.start_time
        } else {
            admission.initial_vitalsigns = {}
            admission.initial_vitalsigns.start_time = admission.start_time
        }

        admission['problems'] = []
        this.problems.value().problems.forEach((problem) => {
            problem.start_time = admission.start_time
            admission['problems'].push(problem)
        })

        admission['patient'] = this.newPatient.value()
        admission['encounters'] = [
            ...this.investigations.value()['encounters'],
            ...this.procedures.value()['encounters'],
            ...this.progress.value()['encounters']
        ]
        admission['prescription'] = this.prescription.value().prescription

        return admission
    }

    setValue(data) {
        if (data) {
            this.newPatient.setValue(data['patient'])
        } else {
            this.newPatient.setValue(null)
        }
        this.admissionDetails.setValue(data)
        this.admissionNotes.setValue(data)
        this.dischargeNotes.setValue(data)
        this.investigations.setValue(data)
        this.procedures.setValue(data)
        this.progress.setValue(data)
        this.problems.setValue(data)
        this.prescription.setValue(data)
    }

    _onNext() {
        super._onNext()
        //localStorage.setItem('wizard_draft', JSON.stringify(this.value()))
        this._saveWizardDraft(this.value())
    }

    _saveWizardDraft(draftValue) {
        localStorage.setItem('wizard_draft', JSON.stringify(draftValue))
    }

    _getWizardDraft() {
        return JSON.parse(localStorage.getItem('wizard_draft'))
    }

    _deleteWizardDraft() {
        localStorage.removeItem('wizard_draft')
    }

    show(afterSave, onCancel) {
        super.show(afterSave, onCancel)

        var draftData = this._getWizardDraft()

        this.setValue(draftData)
    }

    _invalidFieldsList(invalid_fields) {
        if (!invalid_fields) {
            return ""
        }
        if (typeof invalid_fields === 'string') {
            return invalid_fields
        }
        var result = `<ul>`
        for (const [field_name, message] of Object.entries(invalid_fields)) {
            result += `<li><b>${field_name}</b>: ${this._invalidFieldsList(message)}</li>`
        }
        result += `</ul>`
        return result
    }

    onSave(data) {
        var statusDialog = new StatusDialog()

        statusDialog.show(
            'Saving...',
            'Please Wait.',
            false
        )

        connection.post(
            connection.resource_index.admissions,
            data,
            (response) => {
                if (response.error) {
                    statusDialog.setTitle("Failed")
                    statusDialog.setMessage(
                        `${response.error}` + this._invalidFieldsList(response.invalid_fields)
                    )
                    if (response.invalid_fields) {
                        statusDialog.maximize()
                    }
                    statusDialog.showDismiss()
                    return
                }
                this._deleteWizardDraft()
                statusDialog.setTitle("Success")
                statusDialog.setMessage(
                    `Successfully saved Admission  details of ${data.patient.name} (${data.patient.national_id_no}).`
                )
                statusDialog.showDismiss(
                    () => {
                        this.afterSave(response)
                        this.hide()
                    }
                )
            },
            (error) => {
                statusDialog.setTitle("Failed")
                statusDialog.setMessage(
                    `An error occured while saving ${error}.`
                )
                statusDialog.showDismiss()
            },
            () => {}
        )
    }
}