const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
let mainWindow = null;

function getAppDataDir() {
  const userData = app.getPath('appData');
  return path.join(userData, 'dsa-lab-ai');
}

function ensureAppDataDir() {
  const dir = getAppDataDir();
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function startBackend() {
  const backendDir = path.join(__dirname, '..', 'apps', 'backend');
  const env = {
    ...process.env,
    PORT: '4000',
    DATABASE_URL: path.join(ensureAppDataDir(), 'dsa_lab.db'),
    FRONTEND_ORIGIN: 'http://localhost:5173',
    ELECTRON: 'true'
  };

  backendProcess = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'src/index.ts'], {
    cwd: backendDir,
    env,
    stdio: 'inherit'
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Backend exited with code ${code}`);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 980,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.ELECTRON_MODE === 'dev';
  const frontendUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '..', 'apps', 'web', 'dist', 'index.html')}`;

  mainWindow.loadURL(frontendUrl);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill('SIGTERM');
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
});
