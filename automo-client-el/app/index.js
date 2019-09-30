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
})*/