const Form = require('../../controls/form/form')
const TextField = require('../../controls/form/text-field')
const DateField = require('../../controls/form/date-field')
const SelectField = require('../../controls/form/select-field')
const AddressField = require('../form/address-field')


module.exports = class PatientForm extends Form {
    constructor(options = {}) {
        options.labelTop = true
        super(options)
        
        this.addField(
            new TextField(
                'hospital_no',
                {
                    label: "Hospital No",
                    required: true
                }
            )
        )

        this.addField(
            new TextField(
                'national_id_no',
                {
                    label: "National ID No",
                    required: true
                }
            )
        )

        this.addField(
            new TextField(
                'name',
                {
                    label: "Name",
                    required: true
                }
            )
        )

        this.addField(
            new DateField(
                'time_of_birth',
                {
                    label: "Date of Birth",
                    required: true
                }
            )
        )

        this.addField(
            new SelectField(
                'sex',
                (item) => {
                    return item.id
                },
                (item) => {
                    return item.label
                },
                {
                    label: "Sex",
                    required: true,
                    onlyId: true,
                    data:[
                        {
                            id: 'F',
                            label: 'Female'
                        },
                        {
                            id: 'M',
                            label: 'Male'
                        }
                    ]
                }
            )
        )

        this.addField(
            new TextField(
                'allergies',
                {
                    label: "Allergies",
                    type: 'textarea',
                    labelTop: true,
                    grow: true
                }
            )
        )

        this.addField(
            new TextField(
                'phone_no',
                {
                    label: "Phone No",
                    required: false
                }
            )
        )

        this.addField(
            new AddressField(
                'permanent_address',
                {
                    label: "Permanent Address",
                    required: false
                }
            )
        )

        this.addField(
            new AddressField(
                'current_address',
                {
                    label: "Current Address"
                }
            )
        )
    }
}