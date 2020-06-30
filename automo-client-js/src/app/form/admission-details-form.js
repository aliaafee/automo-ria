const Form = require('../../controls/form/form')
const DateTimeField = require('../../controls/form/date-time-field')
const BedField = require("../form/bed-field")
const DoctorField = require("../form/doctor-field")


module.exports = class AdmissionDetailsForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)

        this.addField(new DoctorField(
            'personnel',
            {
                label: 'Admitting Consultant',
                required: true
            }
        ))

        this.addField(new BedField(
            'discharged_bed',
            {
                label: 'Bed',
                required: true,
                labelTop: true,
            }
        ))

        this.addField(new DateTimeField(
            'start_time',
            {
                label: 'Time of Admission',
                required: true,
                labelTop: true,
                narrow: true
            }
        ))

        this.addField(new DateTimeField(
            'end_time',
            {
                label: 'Time of Discharge',
                required: true,
                labelTop: true,
                narrow: true
            }
        ))
    }
}