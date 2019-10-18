const Logger = require("./app/logger");
const Connection = require("./app/connection");
const LoginDialog = require("./app/dialog/login-dialog");

logger = new Logger();
connection = new Connection(logger);

dlgLogin = new LoginDialog();
document.body.appendChild(dlgLogin.createElement());

dlgLogin.form.setValue({
    index_url: 'http://127.0.0.1:5000/api/',
    username: 'admin',
    password: 'a'
})

dlgLogin.tryLogin(
    connection,
    () => {
        console.log("Success");
        document.body.innerHTML = 'Welcome';
    },
    () => {
        console.log("Exit")
    }
);


