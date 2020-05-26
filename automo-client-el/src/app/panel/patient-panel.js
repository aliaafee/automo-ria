const Scrolled = require('../../controls/scrolled');

module.exports = class PatientPanel extends Scrolled {
    constructor(options={}) {
        super(options)
    }

    setPatient(patient) {
        this._idNumberElement.innerHTML = patient.national_id_no;
        this._hospNumberElement.innerHTML = patient.hospital_no;
        this._nameElement.innerHTML = patient.name;
        this._ageSexElement.innerHTML = patient.age + "/" + patient.sex;

        this._headerElement.style.display = 'flex';
        this._bodyElement.style.display = 'flex';
    }

    createElement() {
        super.createElement();

        
        this.element.className = 'patient-panel';
        this.element.style.flexDirection = 'column';

        this._headerElement = document.createElement('div');
        this._headerElement.className = 'header';
        this._headerElement.style.flexDirection = 'column';
        this.element.appendChild(this._headerElement);

        var numberElement = document.createElement('div');
        numberElement.className = 'number';
        this._headerElement.appendChild(numberElement);

        this._idNumberElement = document.createElement('div');
        numberElement.appendChild(this._idNumberElement);

        this._hospNumberElement = document.createElement('div');
        numberElement.appendChild(this._hospNumberElement);

        var detailsElement = document.createElement('div')
        detailsElement.style.display = 'flex';
        detailsElement.style.flexDirection = 'row';
        detailsElement.style.alignItems = 'baseline';
        this._headerElement.appendChild(detailsElement);

        this._nameElement = document.createElement('h1');
        detailsElement.appendChild(this._nameElement);

        this._ageSexElement = document.createElement('span');
        detailsElement.appendChild(this._ageSexElement);

        this._bodyElement = document.createElement('div');
        this._bodyElement.className = 'body';
        this._bodyElement.style.flexDirection = 'column';
        this.element.appendChild(this._bodyElement);

        this._problemsElement = document.createElement('div');
        this._problemsElement.classList = 'tile problems'
        this._problemsElement.innerHTML = '<h2>Problems</h2><div class="tile-body">Problems<br>Problems<br>Problems<br></div>'
        this._bodyElement.appendChild(this._problemsElement)

        this._admissionsElement = document.createElement('div');
        this._admissionsElement.classList = 'tile admissions'
        this._admissionsElement.innerHTML = '<h2>Admissions</h2><div class="tile-body">Admissions<br>Admissions<br>Admissions<br></div>'
        this._bodyElement.appendChild(this._admissionsElement)

        this._headerElement.style.display = 'none';
        this._bodyElement.style.display = 'none';
        
        return this.element;
    }

}