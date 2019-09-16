const ipc = require('electron').ipcRenderer;

const txtIndexUrl = document.querySelector("#indexurl");
const txtUsername = document.querySelector("#username");
const txtPassword = document.querySelector("#password");
const btnLogin = document.querySelector("#login")
const btnQuit = document.querySelector("#quit");
const statusBar = document.querySelector("#status");
const loginForm = document.querySelector("#login-form");

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    ipc.send('login-window-login', {
        index_url: txtIndexUrl.value,
        username: txtUsername.value,
        password: txtPassword.value
    });
    txtUsername.value = "";
    txtPassword.value = "";
    txtUsername.focus();
    statusBar.innerHTML = '<div class="alert alert-light" role="alert">&nbsp;</div>';
    btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Loggin in..';
});

btnQuit.addEventListener('click', () => {
    ipc.send('login-window-quit', 'ping')
});

ipc.on('login-failed', (event, arg) => {
    statusBar.innerHTML = `<div class="alert alert-danger" role="alert">${arg}</div>`;
    btnLogin.innerHTML = 'Login';
    txtUsername.focus();
})

ipc.on('login-success', (event, arg) => {
    btnLogin.innerHTML = 'Login';
    statusBar.innerHTML = '<div class="alert alert-light" role="alert">&nbsp;</div>';
})

txtUsername.focus();