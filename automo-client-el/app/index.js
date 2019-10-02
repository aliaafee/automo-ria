const Connection = require("./js/connection");
const MainWindow = require("./js/main-window");
const LoginDialog = require("./js/dialogs/login-dialog")
const Logger = require("./js/logger");
const StatusDialog = require("./js/dialogs/status-dialog")

logger = new Logger();
connection = new Connection(logger);
mainWindow = new MainWindow(connection);
loginDlg = new LoginDialog();
statusDlg = new StatusDialog()


function tryLogin() {
    loginDlg.show((data) => {
        statusDlg.show();
        statusDlg.setLogger(logger);
        connection.login(
            data.index_url, data.username, data.password,
            () => {
                statusDlg.close(showMainWindow)
            },
            () => {
                statusDlg.close(tryLogin)
            }
        )
    })
}


function showMainWindow() {
    mainWindow.render($('#main-window'));
    mainWindow.initialize();
    mainWindow.setLogger(logger);

    mainWindow.navbar.setLogoutFunction(() => {
        $('#main-window').html("");
        connection.logout(
            tryLogin,
            () => {
                console.log("Failed to Logout.");
                tryLogin();
            }
        )
    });
}

tryLogin();

/*
const Icd10Dialog = require("./js/dialogs/icd10coder-dialog")

var icd = new Icd10Dialog()

icd.show((result) => {
    console.log(result);
})


const TextField = require("./js/controls/text-field")
const FloatField = require("./js/controls/float-field")
const Form = require("./js/controls/form")
const Button = require("./js/controls/button")


var patient = new Form(
    'patient-form',
    'patient'
);

var name = new TextField(
    'patient-name',
    'patient.name',
    {
        label: "Name",
        placeholder: "Name",
        helpText: "Full name of patient",
        invalidFeedback: "The name is not valid",
        required: true,
        default: "Ali Aafee"
    }
);

var age = new FloatField(
    'patient-age',
    'patient.age',
    {
        label: "Age",
        placeholder: "Age",
        helpText: "Age of patient in years",
        invalidFeedback: "The age is not valid",
        required: true
    }
);

patient.addField(name);
patient.addField(age);

$('#dialog').html(
    `<form id="patient-form"></form>
    <button id="A">A</button>
    <button id="B">B</button>`
);

patient.render()

$('#A').click(() => {
    patient.lock();
})


$('#B').click(() => {
    patient.unlock();
})

$('#dialog').append('<button id="do" />')

btn = new Button('do', 'do', 'Do It', () => {
    patient.lock();
})

btn.render();

//console.log(name.validate())*/