const { BrowserWindow, app } = require('electron');
const path = require('path');

class WindowManager {
	constructor(isDev) {
		this.isDev = isDev;
		this.mainWindow = null;
		this.displayWindow = null;
	}

	createMainWindow() {
		this.mainWindow = new BrowserWindow({
			width: 1400,
			height: 900,
			webPreferences: {
				preload: path.join(__dirname, '../preload.js'),
				contextIsolation: true,
				nodeIntegration: false
			}
		});

		const port = process.env.VITE_PORT || '5173';

		if (this.isDev) {
			this.mainWindow.loadURL(`http://localhost:${port}`);
		} else {
			this.mainWindow.loadFile(path.join(app.getAppPath(), 'build/index.html'));
		}

		const openDevTools = process.env.ELECTRON_DEVTOOLS !== 'false';
		if (this.isDev && openDevTools) this.mainWindow.webContents.openDevTools();

		this.mainWindow.on('closed', () => {
			this.mainWindow = null;
		});

		return this.mainWindow;
	}

	openDisplayWindow() {
		if (this.displayWindow) {
			this.displayWindow.focus();
			return;
		}

		this.displayWindow = new BrowserWindow({
			width: 1920,
			height: 1080,
			parent: this.mainWindow,
			webPreferences: {
				preload: path.join(__dirname, '../preload.js'),
				contextIsolation: true,
				nodeIntegration: false
			}
		});

		const port = process.env.VITE_PORT || '5173';

		if (this.isDev) {
			this.displayWindow.loadURL(`http://localhost:${port}/display`);
		} else {
			this.displayWindow.loadFile(path.join(app.getAppPath(), 'build/display.html'));
		}

		const openDevTools = process.env.ELECTRON_DEVTOOLS !== 'false';
		if (this.isDev && openDevTools) this.displayWindow.webContents.openDevTools();

		this.displayWindow.on('closed', () => {
			this.displayWindow = null;
		});
	}

	closeDisplayWindow() {
		if (this.displayWindow) {
			this.displayWindow.close();
		}
	}

	broadcastToAll(channel, data) {
		if (this.mainWindow) {
			this.mainWindow.webContents.send(channel, data);
		}
		if (this.displayWindow) {
			this.displayWindow.webContents.send(channel, data);
		}
	}
}

module.exports = WindowManager;
