const Control = require("../../controls/control");
const Form = require("../../controls/form/form");
const TextField = require('../../controls/form/text-field');
const DateTimeField = require('../../controls/form/date-time-field');
const DateField = require('../../controls/form/date-field');
const BedField = require('../form/bed-field');
const PrescriptionField = require('../form/prescription-field');
const DoctorField = require('../form/doctor-field');
const ProblemsField = require('../form/problems-field');
const Button = require('../../controls/button')

module.exports = class AdmissionPanel extends Control {
    constructor (options) {
        super(options);

        this.data = {}

        this.summary = new Button(
            'Discharge Summary',
            (event) => {
                console.log("yo")
                console.log(this.data)
                connection.get_blob(
                    this.data.discharge_summary,
                    (blob) => {
                        //console.log(blob)
                        var file = window.URL.createObjectURL(blob);
                        window.open(file);
                        window.print()
                    },
                    () => {
                        console.log('failed')
                    }
                )
            }
        )

        this.form = new Form()

        this.form.addField(new DateField(
            'start_time',
            {
                label: "Admitted Date",
                required: true,
                labelSize: '125px'
            }
        ))

        this.form.addField(new DateField(
            'end_time',
            {
                label: "Discharged Date",
                required: true,
                labelSize: '125px'
            }
        ))

        this.form.addField(new DoctorField(
            'personnel',
            {
                label: "Consultant",
                required: true,
                labelSize: '125px'
            }
        ))

        this.form.addField(new BedField(
            'discharged_bed',
            {
                label: 'Bed',
                labelSize: '125px'
            }
        ))

        this.form.addField(new BedField(
            'bed',
            {
                label: 'Bed',
                labelSize: '125px'
            }
        ))

        this.form.addField(new ProblemsField(
            'problems',
            {
                label: 'Diagnosis',
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'chief_complaints',
            {
                label: 'Chief Complaints',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'history',
            {
                label: 'History',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'past_history',
            {
                label: 'Past History',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'general_inspection',
            {
                label: 'General Inspection',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_head',
            {
                label: 'Head',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_neck',
            {
                label: 'Neck',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_chest',
            {
                label: 'Chest',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_abdomen',
            {
                label: 'Abdomen',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_genitalia',
            {
                label: 'Genitalia',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_pelvic_rectal',
            {
                label: 'Pelvin & Rectal',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_extremities',
            {
                label: 'Extremities',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'exam_other',
            {
                label: 'Others',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'hospital_course',
            {
                label: 'Hospital Course',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'discharge_advice',
            {
                label: 'Discharge Advice',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        this.form.addField(new PrescriptionField(
            'prescription',
            {
                label: 'Prescription',
                labelTop: true
            }
        ))

        this.form.addField(new TextField(
            'follow_up',
            {
                label: 'Follow Up',
                type: 'textarea',
                required: true,
                labelTop: true
            }
        ))

        
    }

    setData(data) {
        this.data = data
        this.form.setValue(data);
        this.element.style.display = 'flex';
    }

    createElement() {
        super.createElement();
        this.element.style.flexGrow = 1;
        this.element.style.flexDirection = 'column'

        this.element.appendChild(this.summary.createElement())

        this.element.appendChild(this.form.createElement())
        this.form.element.style.flexGrow = 1;

        this.form.lock();
        this.element.style.display = 'none';

        return this.element
    }


}
