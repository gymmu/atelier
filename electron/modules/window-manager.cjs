const { BrowserWindow } = require('electron');
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
		const url = this.isDev
			? `http://localhost:${port}`
			: `file://${path.join(__dirname, '../../build/index.html')}`;

		this.mainWindow.loadURL(url);

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
		const url = this.isDev
			? `http://localhost:${port}/display`
			: `file://${path.join(__dirname, '../../build/index.html')}#/display`;

		this.displayWindow.loadURL(url);

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
