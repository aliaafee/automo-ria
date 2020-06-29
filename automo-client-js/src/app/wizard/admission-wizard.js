const Wizard = require('../../controls/wizard/wizard')
const WizardPage = require('../../controls/wizard/wizard-page')
const WizardForm = require('../../controls/wizard/wizard-form')

const Form = require("../../controls/form/form")
const PatientForm = require('../form/patient-form')
const AdmissionDetailsForm = require('../form/admission-details-form')
const ProblemsForm = require('../form/problems-form')
const AdmissionNotesForm = require('../form/admission-notes-form')
const DischargeNotesForm = require('../form/discharge-notes-form')

const StatusDialog = require("../../controls/dialog/status-dialog")


class NewPatient extends WizardForm {
    constructor(options = {}) {
        options.title = "Patient Details"

        super(new PatientForm(), options)
        
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
        return super.value()['problems']
    }
}


class AdmissionNotes extends WizardForm {
    constructor(options = {}) {
        options.title = "Admission Notes"
        super(new AdmissionNotesForm(), options)        
    }
}


class Investigations extends WizardPage {
    constructor(options = {}) {
        options.title = "Investigations"
        super(options)
    }

    value() {
        return []
    }
}

class ProceduresReports extends WizardPage {
    constructor(options = {}) {
        options.title = "Procedures/ Reports/ Other Notes"
        super(options)
    }

    value() {
        return []
    }
}

class DischargeNotes extends WizardForm {
    constructor(options = {}) {
        options.title = "Discharge Notes"
        super(new DischargeNotesForm(), options)

    }
}

class Prescription extends WizardPage {
    constructor(options = {}) {
        options.title = "Discharge Prescription"
        super(options)
    }

    value() {
        return []
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
        this.investigations = new Form({title: "Investigations"})
        this.proceduresReports = new Form({title: "Procedures/ Reports/ Other Notes"})
        this.dischargeNotes = new DischargeNotesForm({title: "Discharge Prescription"})
        this.prescription = new Form({title: "Prescription"})
    }

    show(wizard) {
        super.show(wizard)

        this.newPatient.setValue(wizard.newPatient.value())
        this.admissionDetails.setValue(wizard.admissionDetails.value())
        this.problems.setValue(wizard.problems.value())
        this.admissionNotes.setValue(wizard.admissionNotes.value())
        this.investigations.setValue(wizard.investigations.value())
        this.proceduresReports.setValue(wizard.proceduresReports.value())
        this.dischargeNotes.setValue(wizard.dischargeNotes.value())
        this.prescription.setValue(wizard.prescription.value())

        this.newPatient.lock()
        this.admissionDetails.lock()
        this.problems.lock()
        this.admissionNotes.lock()
        this.investigations.lock()
        this.proceduresReports.lock()
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
        this.element.appendChild(this.proceduresReports.createElement())
        this.element.appendChild(this.dischargeNotes.createElement())
        this.element.appendChild(this.prescription.createElement())

        return this.element
    }
}

module.exports = class AdmissionWizard extends Wizard {
    constructor(options) {
        super(options)

        this.newPatient = new NewPatient()
        this.admissionDetails = new AdmissionDetails()
        this.problems = new Problems()
        this.admissionNotes = new AdmissionNotes()
        this.investigations = new Investigations()
        this.proceduresReports = new ProceduresReports()
        this.dischargeNotes = new DischargeNotes()
        this.prescription = new Prescription()
        this.reviewPage = new ReviewPage()

        this.addPage(this.newPatient)
        this.addPage(this.admissionDetails)
        this.addPage(this.problems)
        this.addPage(this.admissionNotes)
        this.addPage(this.investigations)
        this.addPage(this.proceduresReports)
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
        }

        admission['problems'] = []
        this.problems.value().forEach((problem) => {
            problem.start_time = admission.start_time
            admission['problems'].push(problem)
        })

        admission['patient'] = this.newPatient.value()
        admission['encounters'] = this.investigations.value().concat(this.proceduresReports.value())
        admission['prescription'] = this.prescription.value()

        return admission
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
            console.log(message)
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

                statusDialog.setTitle("Success")
                statusDialog.setMessage(
                    `Successfully saved admission details of ${data.patient.name}.`
                )
                statusDialog.showDismiss(
                    () => {
                        this.afterSave(data)
                        this.hide()
                    }
                )
            },
            (error) => {
                console.log(error)
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