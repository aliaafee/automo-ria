const Wizard = require('../../controls/wizard/wizard')
const WizardPage = require('../../controls/wizard/wizard-page')
const WizardForm = require('../../controls/wizard/wizard-form')

const PatientForm = require('../form/patient-form')
const AdmissionDetailsForm = require('../form/admission-details-form')
const ProblemsForm = require('../form/problems-form')
const AdmissionNotesForm = require('../form/admission-notes-form')
const DischargeNotesForm = require('../form/discharge-notes-form')


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

        this.addPage(this.newPatient)
        this.addPage(this.admissionDetails)
        this.addPage(this.problems)
        this.addPage(this.admissionNotes)
        this.addPage(this.investigations)
        this.addPage(this.proceduresReports)
        this.addPage(this.dischargeNotes)
        this.addPage(this.prescription)
    }

    value() {
        var admission = Object.assign(
            {},
            this.admissionDetails.value(),
            this.admissionNotes.value(),
            this.dischargeNotes.value(),
        )

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

    onSave(data) {
        connection.post(
            connection.resource_index.admissions,
            data,
            (response) => {
                console.log(response)
            },
            (error) => {
                console.log(error)
            }
        )
    }
}