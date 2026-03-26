const { app } = require('electron');
const path = require('path');
const FileManager = require('./modules/file-manager.cjs');
const WindowManager = require('./modules/window-manager.cjs');
const { registerHandlers } = require('./modules/ipc-handlers.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Initialize managers
const fileManager = new FileManager(app.getPath('userData'));
const windowManager = new WindowManager(isDev);

// Register IPC handlers
registerHandlers(fileManager, windowManager);

app.whenReady().then(() => {
	windowManager.createMainWindow();

	app.on('activate', () => {
		if (!windowManager.mainWindow) {
			windowManager.createMainWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
