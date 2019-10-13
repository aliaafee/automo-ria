const ListBox = require("./controls/list-box");
const Button = require("./controls/button");

var ctrl = new ListBox(
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    (id) => {
        console.log(id);
        ctrl.show();
    },
    {
        height: '300px'
    }
);

elem = ctrl.createElement();

document.body.appendChild(elem);

var data = []

for (var i = 0; i < 100; i++) {
    data.push({
        id: i,
        label: i
    })
}


btn = new Button(
    'Do It',
    (ev) => {
        ctrl.setData(data);
    }
)

document.body.appendChild(btn.createElement());


const TextBox = require('./controls/text-box');

txt = new TextBox(
    'Yo man'
)

document.body.appendChild(txt.createElement());


const Field = require('./controls/form/field');

fld = new Field('yo', 'Yo');

document.body.appendChild(fld.createElement());

const TextField = require('./controls/form/text-field');

fld = new TextField(
    'name',
    'Full Name',
    {
        labelSize: 20,
        invalidFeedback: "Invalid Input",
    }
);

document.body.appendChild(fld.createElement());


fld = new TextField(
    'name',
    'Full Name',
    {
        labelSize: 20,
        invalidFeedback: "Invalid Input",
        helpText: "Enter your full name here",
        placeholder: "Fullname"
    }
);

document.body.appendChild(fld.createElement());


const Popup = require("./controls/popup");


var pop = new Popup(
    fld,
    {
        width: '100px',
        height: '200px'
    }
);

document.body.appendChild(pop.createElement());


console.log("Hello world")

ctrl.setData(data);


btn = new Button(
    'Do It',
    (ev) => {
        fld.markInvalid();
    }
)

document.body.appendChild(btn.createElement());


