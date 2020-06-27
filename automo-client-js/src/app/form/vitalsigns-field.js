const FloatField = require("../../controls/form/float-field")
const BPField = require("./bp-field")
const FormField = require("../../controls/form/form-field")

module.exports = class VitalSignsField extends FormField {
    constructor(name, options={}) {
        super(name, options);
        this.form.options.labelSize = "25%"
        
        this.form.addField(new FloatField(
            'pulse_rate',
            {
                label: 'Pulse Rate (/min)'
            }
        ))

        this.form.addField(new FloatField(
            'respiratory_rate',
            {
                label: 'Respiratory Rate (/min)'
            }
        ))

        this.form.addField(new BPField(
            'blood_pressure',
            {
                label: 'Blood Pressure (mmHg)'
            }
        ))

        this.form.addField(new FloatField(
            'temperature',
            {
                label: 'Temperature (&deg;C)'
            }
        ))
    }

    value() {    
        var value = super.value();
        
        if (value['blood_pressure'] != null) {
            value['diastolic_bp'] = value['blood_pressure']['diastolic_bp']
            value['systolic_bp'] = value['blood_pressure']['systolic_bp']
        } else {
            value['diastolic_bp'] = null
            value['systolic_bp'] = null
        }
        delete(value['blood_pressure'])
        

        return value
    }

    setValue(value) {
        if (!value) {
            this.form.clear()
            return
        }

        if (value['systolic_bp'] || value['diastolic_bp']) {
            value['blood_pressure'] = {
                'systolic_bp': value['systolic_bp'],
                'diastolic_bp': value['diastolic_bp']
            }

            delete(value['systolic_bp'])
            delete(value['diastolic_bp'])
        }

        super.setValue(this.value)
    }
}