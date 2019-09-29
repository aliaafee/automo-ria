const Connection = require("./js/connection");
const MainWindow = require("./js/main-window");
const LoginDialog = require("./js/dialog/login-dialog")
const Logger = require("./js/logger");
const StatusDialog = require("./js/dialog/status-dialog")

logger = new Logger();
connection = new Connection(logger);
mainWindow = new MainWindow(connection);
loginDlg = new LoginDialog();
statusDlg = new StatusDialog()

//mainWindow.render($('#main-window'));


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
