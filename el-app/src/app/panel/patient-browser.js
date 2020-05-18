const Control = require('../../controls/control');
const TextBox = require('../../controls/text-box');
const ListBox = require('../../controls/list-box');
const Splitter = require('../../controls/splitter');



class PatientList extends Control {
    constructor(option={}) {
        super(option);

        this.searchBox = new TextBox();
        this.resultList = new ListBox(
            (item) => {
                return item.id;
            },
            (item) => {
                return item.name;
            },
            (item) => {
                console.log(item);
            }
        )
    }

    createElement() {
        super.createElement();

        this.element.appendChild(this.searchBox.createElement());

        this.element.appendChild(this.resultList.createElement());

        this.element.style.display = 'flex';

        return this.element;
    }
}


module.exports = class PatientBrowser extends Splitter {
    constructor(options={}) {
        var patientList = new PatientList();
        var paitentView = new Control();

        options.pane1Size = '200px';
        options.resizable = true;

        super(
            patientList,
            paitentView,
            options
        )
    }
};