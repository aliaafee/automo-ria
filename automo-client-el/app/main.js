const {app, BrowserWindow} = require('electron');

let mainWindow = null;

app.on('ready', () => {
	console.log('Hellow World!');
	mainWindow = new BrowserWindow();
});


