const Form = require('../../controls/form/form')
const TextField = require('../../controls/form/text-field')
const VitalSignsField = require("../form/vitalsigns-field")


module.exports = class AdmissionNotesForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new TextField(
            'chief_complaints',
            {
                label: 'Chief Complaints',
                type: 'textarea',
                required: true,
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'history',
            {
                label: 'History',
                type: 'textarea',
                require: true,
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'past_history',
            {
                label: 'Past History',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new VitalSignsField(
            'vitalsigns',
            {
                label: 'Vital Signs',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'mental_state',
            {
                label: 'Mental State Examination',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'general_inspection',
            {
                label: 'General Inspection',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_head',
            {
                label: 'Head',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_neck',
            {
                label: 'Neck',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_chest',
            {
                label: 'Chest',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_abdomen',
            {
                label: 'Abdomen',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_genitalia',
            {
                label: 'Genitalia',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_pelvic_rectal',
            {
                label: 'Pelvin & Rectal',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_extremities',
            {
                label: 'Extremities',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))

        this.addField(new TextField(
            'exam_other',
            {
                label: 'Others',
                type: 'textarea',
                labelTop: true,
                grow: true
            }
        ))
    }
}