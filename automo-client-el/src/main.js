const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
        width: 1024,
        height: 600,
        minWidth: 500,
        minHeight: 500,
        show: false
    });

    mainWindow.loadURL(`file://${__dirname}/index.html`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.setMenuBarVisibility(false);
        mainWindow.show();
        mainWindow.webContents.openDevTools();
    });
});
