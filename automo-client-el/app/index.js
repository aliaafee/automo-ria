const { ipcRenderer } = require('electron');
const Connection = require("./js/connection");
const Logger = require("./js/logger")

const btn_username = document.querySelector('#btn-username');
const lbl_username = document.querySelector('#lbl-username');
const btn_logout = document.querySelector('#btn-logout');
const lbl_server_add = $('#lbl-server-add');


var conn = new Connection();
var logger = new Logger($('#lbl-status'));


ipcRenderer.on('login-try', (event, arg) => {
    logger.log_spinner("Attempting to Login...");
    conn.login(
        arg['index_url'],
        arg['username'],
        arg['password'],
        () => {
            ipcRenderer.send('login-success');
            $('#lbl-username').html(conn.user.username);
            $('#lbl-server-add').html(conn.index_url);
            logger.log_success("Login Succesful.");
        },
        (errorMessage) => {
            ipcRenderer.send('login-failed', errorMessage);
            $('#lbl-username').html("");
            $('#lbl-server-add').html("");
            logger.log_error("Login Failed.");
        }
    )
})


btn_logout.addEventListener('click', () => {
    conn.logout(
        () => {
            ipcRenderer.send('logout');
            $('#lbl-username').html("");
        }
    )
})


function displayPatientList(data) {
    var result = "";

    data['patients'].forEach(element => {
        result += `<tr><td>${element['id']}</td><td>${element['name']}</td><td>${element['url']}</td></tr>`
    });

    $('#results-section').html(
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

$('#btn-patient-list').click(() => {
    logger.log_spinner("Getting Patient List...");
    conn.get(
        conn.index_url,
        data => {
            conn.get(
                data['patients'],
                data => {
                    displayPatientList(data);
                    logger.log_success("Got Patient List.");
                },
                error => {
                    console.log("Failed", error);
                    logger.log_error("Failed to get Paient List.");
                }
            )
        },
        errorMessage => {
            console.log("Failed:", errorMessage);
            logger.log_error("Failed to get Paient List.");
        }
    );
});
