const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow = null;


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
        show: true,
        width: 1200, height:730
    });
    mainWindow.webContents.loadURL(`file://${__dirname}/index.html`); // #A
    mainWindow.webContents.openDevTools();
    mainWindow.setMenuBarVisibility(false);
});
