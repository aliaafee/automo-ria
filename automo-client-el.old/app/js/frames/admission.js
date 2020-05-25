const Frame = require('./base-frame');
const ResourceForm = require("../controls/resource-form");
const TextField = require("../controls/text-field");


class AdmissionFrame extends Frame {
    constructor(elementId, name, connection) {
        super(elementId);

        this.name = name;
        this.connection = connection

    }

    setPatient(patient) {
        this.patient_form.setUrls(patient.url, patient.url);
        this.patient_form.getData();
    }

    getHtml() {
        return `
            <div id="${this.elementId}" class="container">
                <div id="${this.elementId}-contents">
                    <h1 id="${this.elementId}-title-name" class="alert-heading">Patient Name</h1>
                    <p id="${this.elementId}-title-age-sex">99 years, Female</p>
                    <p id="${this.elementId}-title-address">Ma. Some House, Roashanee Magu, K. Male</p>
                    <hr>
                    
                    <h2>Admission</h2>
                    <p>Date of Admission: 2020-10-30, Date of Discharge</p>
                    
                    <h3>Diagnosis</h3>
                    <ul>
                        <li>X01 - Schizophrenia</li>
                        <li>X02 - Something else</li>
                        <li>D01 - Hypertension </li>
                    </ul>
                    
                    <h3>History</h3>
                    <p>This is the history of th patient</p>
                    <p>Past history</p>
                    <p>Personal and Family hx</p>

                    <h3>Examination</h3>
                    <h4>Vital Signs</h2>
                    <p>Blood Pressure: 120/60 mmHg, Pulse Rate: 90/min, Respiratory Rate: 18/min

                    <h3>MSE at admission


                </div>
            </div>`;
    }

    render(target) {
        super.render(target);

        var contentsElement = this.getContentsElement();

        this.patient_form.render(contentsElement);
    }
}

module.exports = AdmissionFrame;