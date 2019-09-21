const { ipcRenderer } = require('electron');
const Connection = require("./js/connection");
const Logger = require("./js/logger")

const btn_username = document.querySelector('#btn-username');
const lbl_username = document.querySelector('#lbl-username');
const btn_logout = document.querySelector('#btn-logout');
const lbl_server_add = $('#lbl-server-add');


var logger = new Logger($('#lbl-status'));
var conn = new Connection(logger);

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
    conn.get(
        conn.index_url,
        data => {
            conn.get(
                data['patients'],
                data => {
                    displayPatientList(data);
                },
                error => {
                    $('#results-section').html("");
                }
            )
        },
        error => {
            $('#results-section').html("");
        }
    );
});
