const Logger = require("./app/logger");
const Connection = require("./app/connection");
const LoginDialog = require("./app/dialog/login-dialog");

logger = new Logger();
connection = new Connection(logger);

dlgLogin = new LoginDialog();

displayPatients = (data) => {
    var result = "";
    
    data['patients'].forEach(element => {
        result += `<tr><td>${element['id']}</td><td>${element['name']}</td><td>${element['url']}</td></tr>`
    });

    document.body.innerHTML = (
        `<table class="table table-striped table-sm">
            <thead>
                <tr><td>Id</td><td>Name</td><td>URL</td></tr>
            </head>
            <tbody>
                ${result}
            </tbody>
        </table>`
    );
}

showMainWindow = () => {
    connection.get(
        connection.index_url,
        data => {
            connection.get(
                data['patients'],
                data => {
                    displayPatients(data);
                },
                (error) => {
                    console.log(error);
                },
                () => {
                    console.log('clean up');
                }
            )
        },
        (error) => {
            console.log(error);
        },
        () => {
            console.log('clean up');
        }
    )
}




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
        showMainWindow();
    },
    () => {
        console.log("Exit")
    }
);


