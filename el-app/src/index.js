const ListBox = require("./controls/list-box");
const Button = require("./controls/button");



var ctrl = new ListBox(
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    (item) => {
        console.log(item);
    },
    {
        height: '100px'
    }
);

elem = ctrl.createElement();

document.body.appendChild(elem);

const SpinnerForeground = require('./controls/spinner-foreground');

spin = new SpinnerForeground();

//document.body.appendChild(spin.createElement());

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

txt = new TextBox({
    placeholder: 'Yo man',
    type: 'password'
});

document.body.appendChild(txt.createElement());

btn = new Button(
    'Lock',
    (ev) => {
        txt.lock();
    }
);
document.body.appendChild(btn.createElement());
btn = new Button(
    'UnLock',
    (ev) => {
        txt.unlock();
    }
);
document.body.appendChild(btn.createElement());


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

const SearchBox = require("./controls/search-box");


src = new SearchBox(
    (query) => {
        result = []
        data.forEach((item) => {
            if (String(item.id).includes(query)) {
                result.push(item);
            }
        })
        return result;
    },
    (item) => {
        return item.id;
    },
    (item) => {
        return item.label;
    },
    (item) => {
        console.log(item);
    },
    {
        popupHeight: '100px',
        placeholder: 'Search numbers'
    }
)

document.body.appendChild(src.createElement());


fld = new TextField(
    'name',
    'Full Name',
    {
        labelSize: 20,
        invalidFeedback: "Invalid Input",
        helpText: "Enter your full name here",
        placeholder: "Fullname",
        required: true
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

//ctrl.setData(data);


btn = new Button(
    'Do It',
    (ev) => {
        fld.validate();
    }
)

document.body.appendChild(btn.createElement());


//Form **************************************************
const Form = require('./controls/form/form');
const FloatField = require('./controls/form/float-field');

frm = new Form({
    labelSize: '60px'
});
frm.addField(new TextField(
    'fullname',
    'Fullname',
    {
        placeholder: "Fullname of Patient",
        required: true,
        invalidFeedback: "This Field cannot be empty.",
        helpText: "The long and fullname."
    }
));
frm.addField(new FloatField(
    'age',
    'Age',
    {
        placeholder: "Age in Years"
    }
))

document.body.appendChild(frm.createElement());

btn = new Button(
    'Validate',
    (ev) => {
        frm.validate();
    }
);
document.body.appendChild(btn.createElement());

btn = new Button(
    'Value',
    (ev) => {
        console.log(frm.value());
    }
);
document.body.appendChild(btn.createElement());

btn = new Button(
    'Lock',
    (ev) => {
        frm.lock();
    }
);
document.body.appendChild(btn.createElement());

btn = new Button(
    'Unlock',
    (ev) => {
        frm.unlock();
    }
);
document.body.appendChild(btn.createElement());



//Spinner ***********************************
const Spinner = require('./controls/spinner');

spin = new Spinner();

document.body.appendChild(spin.createElement());


