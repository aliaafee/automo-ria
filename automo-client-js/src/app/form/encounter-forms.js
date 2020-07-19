const Form = require('../../controls/form/form')
const DateTimeField = require('../../controls/form/date-time-field')
const TextField = require('../../controls/form/text-field')
const FloatField = require('../../controls/form/float-field')
const DoctorField = require('../form/doctor-field')


module.exports.encounter = class Encounter extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new DateTimeField(
            'start_time',
            {
                label: 'Start Time',
                labelTop: true,
                narrow: true
            }
        ))

    }
}


module.exports.measurements = class Measurements extends module.exports.encounter {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.getFieldByName('start_time').setLabel("Record Time")

        this.addField(new FloatField(
            'weight',
            {
                label: 'Weight (kg)'
            }
        ))

        this.addField(new FloatField(
            'height',
            {
                label: 'Height (m)'
            }
        ))
    }
}

module.exports.vitalsigns = class VitalSigns extends module.exports.encounter {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.getFieldByName('start_time').setLabel("Record Time")

        this.addField(new FloatField(
            'pulse_rate',
            {
                label: 'Weight (kg)'
            }
        ))

        this.addField(new FloatField(
            'respiratory_rate',
            {
                label: 'Height (m)'
            }
        ))

        this.addField(new FloatField(
            'diastolic_bp',
            {
                label: 'Weight (kg)'
            }
        ))

        this.addField(new FloatField(
            'systolic_bp',
            {
                label: 'Height (m)'
            }
        ))

        this.addField(new FloatField(
            'temperature',
            {
                label: 'Height (m)'
            }
        ))
    }
}

module.exports.otherencounter = class OtherEncounter extends module.exports.encounter {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new TextField(
            'title',
            {
                label: 'Title'
            }
        ))

        this.addField(new TextField(
            'note',
            {
                label: 'Note',
                type: 'textarea',
                grow: true
            }
        ))
    }
}


module.exports.progress = class Progress extends module.exports.encounter {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.getFieldByName('start_time').setLabel("Examination Time")

        this.addField(new DoctorField(
            'personnel',
            {
                label: 'Examining Doctor'
            }
        ))

        this.addField(new TextField(
            'subjective',
            {
                label: 'Subjective',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'objective',
            {
                label: 'Objective',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'assessment',
            {
                label: 'Assessment',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'plan',
            {
                label: 'Plan',
                type: 'textarea',
                grow: true
            }
        ))
    }
}


module.exports.surgicalprocedure = class SurgicalProcedure extends module.exports.encounter {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new DateTimeField(
            'end_time',
            {
                label: 'End Time',
                labelTop: true,
                narrow: true
            }
        ))
        
        this.addField(new DoctorField(
            'personnel',
            {
                label: 'Operating Surgeon'
            }
        ))

        this.addField(new TextField(
            'assistant',
            {
                label: 'Assistant(s)',
            }
        ))

        this.addField(new TextField(
            'anesthetist',
            {
                label: 'Anesthetist(s)',
            }
        ))

        this.addField(new TextField(
            'nurse',
            {
                label: 'Nurse(s)',
            }
        ))
        
        /*
        this.addField(new TextField(
            'emergency',
            {
                label: 'Emergancy(true/false)',
            }
        ))*/

        this.addField(new TextField(
            'preoperative_diagnosis',
            {
                label: 'Preoperative Diagnosis',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'postoperative_diagnosis',
            {
                label: 'Postoperative Diagnosis',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'procedure_name',
            {
                label: 'Procedure Name',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'findings',
            {
                label: 'Findings',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'steps',
            {
                label: 'Steps',
                type: 'textarea',
                grow: true
            }
        ))
    }
}


module.exports.investigation = class InvestigationForm extends module.exports.encounter {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.getFieldByName('start_time').setLabel("Report Time")
    }
}


module.exports.imaging = class ImagingForm extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new TextField(
            'site',
            {
                label: 'Site',
                required: true,
            }
        ))

        this.addField(new TextField(
            'imaging_type',
            {
                label: 'Imaging Modality',
                required: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'report',
            {
                label: 'Report',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'impression',
            {
                label: 'Impression',
                type: 'textarea',
                required: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'radiologist',
            {
                label: 'Radiologist',
                required: true,
                grow: true
            }
        ))
    }
}


module.exports.endoscopy = class EndoscopyForm extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new TextField(
            'site',
            {
                label: 'Site',
                required: true,
            }
        ))

        this.addField(new TextField(
            'report',
            {
                label: 'Report',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'impression',
            {
                label: 'Impression',
                type: 'textarea',
                required: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'endoscopist',
            {
                label: 'Endoscopist',
                required: true,
                grow: true
            }
        ))
    }
}


module.exports.histopathology = class HistopathologyForm extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new TextField(
            'site',
            {
                label: 'Site',
                required: true,
            }
        ))

        this.addField(new TextField(
            'report',
            {
                label: 'Report',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'impression',
            {
                label: 'Impression',
                type: 'textarea',
                required: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'pathologist',
            {
                label: 'Pathologist',
                required: true,
                grow: true
            }
        ))
    }
}


module.exports.otherreport = class OtherReportForm extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new TextField(
            'name',
            {
                label: 'Name of Report',
                required: true,
            }
        ))

        this.addField(new TextField(
            'report',
            {
                label: 'Report',
                type: 'textarea',
                grow: true
            }
        ))

        this.addField(new TextField(
            'impression',
            {
                label: 'Impression',
                type: 'textarea',
                required: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'reported_by',
            {
                label: 'Reported By',
                required: true,
                grow: true
            }
        ))
    }
}


module.exports.completebloodcount = class CompleteBloodCount extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new FloatField(
            'hemoglobin',
            {
                label: 'Hemoglobin (g%)'
            }
        ))

        this.addField(new FloatField(
            'plt',
            {
                label: 'Platelate Count (10^9/L)'
            }
        ))

        this.addField(new FloatField(
            'tlc',
            {
                label: 'Total Leucocyte Count (10^9/L)'
            }
        ))
        
        this.addField(new FloatField(
            'dlc_n',
            {
                label: 'DLC Neutrophils (%)',
                narrow: true
            }
        ))

        this.addField(new FloatField(
            'dlc_l',
            {
                label: 'DLC Lymphocytes (%)',
                narrow: true
            }
        ))

        this.addField(new FloatField(
            'dlc_m',
            {
                label: 'DLC Monocytes (%)',
                narrow: true
            }
        ))

        this.addField(new FloatField(
            'dlc_e',
            {
                label: 'DLC Eiosinophils (%)',
                narrow: true
            }
        ))
    }
}


module.exports.renalfunctiontest = class RenalFunctionTest extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new FloatField(
            'urea',
            {
                label: 'Serum Urea (mmol/L)'
            }
        ))

        this.addField(new FloatField(
            'creatinine',
            {
                label: 'Serum Creatinine (mmol/L'
            }
        ))

    }
}


module.exports.liverfunctiontest = class LiverFunctionTest extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new FloatField(
            't_bil',
            {
                label: 'Total Billirubin (mmol/L)'
            }
        ))

        this.addField(new FloatField(
            'd_bil',
            {
                label: 'Direct Billirubin (mmol/L'
            }
        ))

        this.addField(new FloatField(
            'alt',
            {
                label: 'Alanine Amino Transferase (U/L)'
            }
        ))

        this.addField(new FloatField(
            'ast',
            {
                label: 'Aspartate Amino Transferase (U/L)'
            }
        ))

        this.addField(new FloatField(
            'alp',
            {
                label: 'Alkaline Phosphatase (U/L)'
            }
        ))
    }
}


module.exports.othertest = class OtherTest extends module.exports.investigation {
    constructor(options={}) {
        super(options)

        this.addField(new TextField(
            'name',
            {
                placeholder: 'Name'
            }
        ))

        this.addField(new TextField(
            'value',
            {
                placeholder: 'Value',
                narrow: true
            }
        ))

        this.addField(new TextField(
            'unit',
            {
                placeholder: 'Unit',
                narrow: true
            }
        ))
    }
}