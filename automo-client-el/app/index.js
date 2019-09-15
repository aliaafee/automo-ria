const {ipcRenderer} = require('electron');
const Connection = require("./js/connection");

const load_patient = document.querySelector('.load-patient');
const logout_button = document.querySelector('.logout');
const result_section = document.querySelector('.result');


var conn = new Connection();


ipcRenderer.on('login-try', (event, arg) => {
  console.log("Trying to login");
  conn.login(
    arg['index_url'],
    arg['username'],
    arg['password'],
    () => {
      ipcRenderer.send('login-success')
    },
    (errorMessage) => {
      ipcRenderer.send('login-failed', errorMessage)
    }
  )
})


logout_button.addEventListener('click', () => {
  conn.logout(
    () => {
      ipcRenderer.send('logout')
    }
  )
})


function displayPatientList(data) {
  var result = "";

  data['patients'].forEach(element => {
    result += `<tr><td>${element['id']}</td><td>${element['name']}</td><td>${element['url']}</td></tr>`
  });

  result_section.innerHTML = `<table>${result}</table>`;
}


load_patient.addEventListener('click', () => {
  conn.get(
    conn.index_url,
    data => {
      conn.get(
        data['patients'],
        data => {
          displayPatientList(data)
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
