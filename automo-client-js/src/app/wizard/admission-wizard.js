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
}

class ProceduresReports extends WizardPage {
    constructor(options = {}) {
        options.title = "Procedures/ Reports/ Other Notes"
        super(options)
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
}

module.exports = class AdmissionWizard extends Wizard {
    constructor(options) {
        super(options)

        this.addPage(
            new NewPatient()
        )

        this.addPage(
            new AdmissionDetails()
        )

        this.addPage(
            new Problems()
        )

        this.addPage(
            new AdmissionNotes()
        )

        this.addPage(
            new Investigations()
        )

        this.addPage(
            new ProceduresReports()
        )

        this.addPage(
            new DischargeNotes()
        )

        this.addPage(
            new Prescription()
        )
    }
}