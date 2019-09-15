const { app, BrowserWindow, ipcMain} = require('electron');

let mainWindow = null; // #A
let loginWindow = null;

app.on('ready', () => {
  console.log('Hello from Electron.');
  mainWindow = new BrowserWindow({
    webPreferences: {nodeIntegration: true},
    show: false
  });
  mainWindow.webContents.loadURL(`file://${__dirname}/index.html`); // #A
  mainWindow.webContents.openDevTools();

  loginWindow = new BrowserWindow({
    webPreferences: {nodeIntegration: true},
    parent: mainWindow, modal: true,
    width:400, height:245,
    frame: false,
    show: true,
    backgroundColor: '#ffffff'
  });
  loginWindow.setMenuBarVisibility(false);
  loginWindow.loadURL(`file://${__dirname}/login.html`);
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