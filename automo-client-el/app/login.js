const ipc = require('electron').ipcRenderer;

const txtIndexUrl = document.querySelector("#indexurl");
const txtUsername = document.querySelector("#username");
const txtPassword = document.querySelector("#password");
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
    statusBar.innerHTML = "Logging in...";
});

btnQuit.addEventListener('click', () => {
    ipc.send('login-window-quit', 'ping')
});

ipc.on('login-failed', (event, arg) => {
    statusBar.innerHTML = `${arg}`;
    txtUsername.focus();
})

ipc.on('login-success', (event, arg) => {
    statusBar.innerHTML = "";
})

txtUsername.focus();