const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow = null; // #A
let loginWindow = null;

app.on('ready', () => {
    console.log('Hello from Electron.');
    mainWindow = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
        show: false,
        width: 1200, height:768
    });
    mainWindow.webContents.loadURL(`file://${__dirname}/index.html`); // #A
    mainWindow.webContents.openDevTools();

    loginWindow = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
        parent: mainWindow, modal: true,
        width: 300, height: 280,
        frame: false,
        show: true,
        backgroundColor: '#ffffff'
    });
    loginWindow.setMenuBarVisibility(false);
    loginWindow.loadURL(`file://${__dirname}/login.html`);
    //loginWindow.webContents.openDevTools();
});


ipcMain.on('login-window-quit', (event, arg) => {
    app.quit();
})


ipcMain.on('login-window-login', (event, arg) => {
    mainWindow.webContents.send('login-try', arg);
})


ipcMain.on('login-success', (event, arg) => {
    loginWindow.webContents.send('login-success', arg);
    loginWindow.hide();
    mainWindow.show();
})


ipcMain.on('login-failed', (event, arg) => {
    loginWindow.webContents.send('login-failed', arg);
})


ipcMain.on('logout', (event, arg) => {
    mainWindow.hide();
    loginWindow.show();
})