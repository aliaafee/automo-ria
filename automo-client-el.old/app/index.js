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


function tryLogin(message="") {
    loginDlg.show(message, (data) => {
        statusDlg.show();
        statusDlg.setLogger(logger);
        connection.login(
            data.index_url, data.username, data.password,
            () => {
                statusDlg.close(showMainWindow)
            },
            (error) => {
                statusDlg.close(() => {
                    tryLogin(error.message)
                })
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
const ResourceForm = require("./js/controls/resource-form")
const Button = require("./js/controls/button")


var patient = new ResourceForm(
    'patient-form',
    'patient',
    connection,
    'http://get/patient',
    'http://post/patient',
    {
        title: "Patient Information"
    }
);

var name = new TextField(
    'patient-name',
    'patient.name',
    {
        label: "Name",
        placeholder: "Name",
        //helpText: "Full name of patient",
        invalidFeedback: "The name is not valid",
        required: true,
        default: "Ali Aafee",
    }
);

var age = new FloatField(
    'patient-age',
    'patient.age',
    {
        label: "Age",
        placeholder: "Age",
        invalidFeedback: "The age is not valid",
        required: true
    }
);

patient.addField('name', name);
patient.addField('age', age);

$('#dialog').html(
    `<form id="patient-form"></form>This is after the form`
);



btnLock = new Button('lock', 'lock', 'Lock', (e) => {
    patient.lock();
}, {
    icon: 'search'
})

btnUnlock = new Button('unlock', 'unlock', 'Unlock', (e) => {
    patient.unlock();
})

//patient.addButton(btnLock)
//patient.addButton(btnUnlock)

patient.render()

patient.getData();

//console.log(name.validate())
*/
