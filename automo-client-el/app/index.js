const { ipcRenderer } = require('electron');
const Connection = require("./js/connection");

const btn_username = document.querySelector('#btn-username');
const lbl_username = document.querySelector('#lbl-username');
const btn_logout = document.querySelector('#btn-logout');
const lbl_server_add = $('#lbl-server-add');


var conn = new Connection();


ipcRenderer.on('login-try', (event, arg) => {
    console.log("Trying to login");
    conn.login(
        arg['index_url'],
        arg['username'],
        arg['password'],
        () => {
            ipcRenderer.send('login-success');
            lbl_username.innerHTML = conn.user.username;
            lbl_server_add.innerHTML = conn.index_url;
        },
        (errorMessage) => {
            ipcRenderer.send('login-failed', errorMessage)
            lbl_username.innerHTML = "";
            lbl_server_add.innerHTML = "";
        }
    )
})


btn_logout.addEventListener('click', () => {
    conn.logout(
        () => {
            ipcRenderer.send('logout');
            lbl_username.innerHTML = "";
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
                    console.log("Failed", error);
                }
            )
        },
        errorMessage => {
            console.log("Failed:", errorMessage);
        }
    );
});
