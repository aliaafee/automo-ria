const Frame = require('./base-frame');
const ResourceForm = require("../controls/resource-form");
const TextField = require("../controls/text-field");


class PatientFrame extends Frame {
    constructor(elementId, name, connection) {
        super(elementId);

        this.name = name;
        this.connection = connection

        this.patient_form = new ResourceForm(
            'patient-form',
            'patient',
            this.connection
        )

        this.patient_form.addField(
            new TextField(
                'patient-hospital_no',
                'hospital_no',
                {
                    label: 'Hosp&nbsp;No.',
                    placeholder: 'Hosp No.',
                    required: true
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-national_id_no',
                'national_id_no',
                {
                    label: 'NIC&nbsp;No.',
                    placeholder: 'NIC No.',
                    required: true
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-name',
                'name',
                {
                    label: "Name",
                    placeholder: "Name",
                    //helpText: "Full name of patient",
                    //invalidFeedback: "The name is not valid",
                    required: true,
                    //default: ""
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-time_of_birth',
                'time_of_birth',
                {
                    label: "time_of_birth",
                    placeholder: "time_of_birth",
                    required: true
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-time_of_death',
                'time_of_death',
                {
                    label: "time_of_death",
                    placeholder: "time_of_death",
                    required: false
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-sex',
                'sex',
                {
                    label: "sex",
                    placeholder: "sex",
                    required: true
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-allergies',
                'allergies',
                {
                    label: "allergies",
                    placeholder: "allergies",
                    required: false
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-phone_no',
                'phone_no',
                {
                    label: "phone_no",
                    placeholder: "phone_no",
                    required: false
                }
            )
        )

        /*
        this.patient_form.addField(
            new TextField(
                'patient-permanent_address',
                'permanent_address',
                {
                    label: "permanent_address",
                    placeholder: "permanent_address",
                    required: true
                }
            )
        )

        this.patient_form.addField(
            new TextField(
                'patient-current_address',
                'current_address',
                {
                    label: "current_address",
                    placeholder: "current_address",
                    required: true
                }
            )
        )*/
    }

    setPatient(patient) {
        this.patient_form.setUrls(patient.url, patient.url);
        this.patient_form.getData();
    }

    render(target) {
        super.render(target);

        var contentsElement = this.getContentsElement();

        this.patient_form.render(contentsElement);
    }
}

module.exports = PatientFrame;