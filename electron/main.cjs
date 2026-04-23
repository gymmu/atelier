const { app, dialog } = require('electron');
const path = require('path');
const FileManager = require('./modules/file-manager.cjs');
const WindowManager = require('./modules/window-manager.cjs');
const SettingsManager = require('./modules/settings-manager.cjs');
const { registerHandlers } = require('./modules/ipc-handlers.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Initialize managers
const settingsManager = new SettingsManager(app.getPath('userData'));
let fileManager = null;
const windowManager = new WindowManager(isDev);

// Initialize working directory
async function initWorkingDirectory() {
	await settingsManager.load();

	let workingDir = settingsManager.getWorkingDirectory();

	// If no working directory is set, prompt user
	if (!workingDir) {
		const result = await dialog.showOpenDialog({
			title: 'Wähle ein Arbeitsverzeichnis für Atelier',
			properties: ['openDirectory', 'createDirectory'],
			buttonLabel: 'Auswählen',
			message: 'Wähle ein Verzeichnis wo alle Atelier-Daten gespeichert werden sollen.'
		});

		if (result.canceled || result.filePaths.length === 0) {
			// User canceled, use default in Documents
			workingDir = path.join(app.getPath('home'), 'atelier');
		} else {
			workingDir = result.filePaths[0];
		}

		await settingsManager.setWorkingDirectory(workingDir);
	}

	// Initialize file manager with working directory
	fileManager = new FileManager(workingDir);
	return workingDir;
}

// Register IPC handlers (will be called after init)
function setupIPC() {
	registerHandlers(fileManager, windowManager, settingsManager);
}

app.whenReady().then(async () => {
	// Initialize working directory first
	const workingDir = await initWorkingDirectory();
	console.log('Working directory:', workingDir);
	console.log('Settings location:', settingsManager.getSettingsLocation());
	console.log('Data directory:', workingDir);

	// Setup IPC handlers
	setupIPC();

	// Create main window
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
