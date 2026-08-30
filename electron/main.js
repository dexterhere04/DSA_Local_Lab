const { app, BrowserWindow, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

let backendProcess = null;
let mainWindow = null;

const isPackaged = app.isPackaged;
const rootDir = isPackaged ? __dirname : path.join(__dirname, '..');

function getBackendEntry() {
  return isPackaged
    ? path.join(rootDir, 'backend', 'index.cjs')
    : path.join(rootDir, 'apps', 'backend', 'dist', 'index.cjs');
}

function getWebDistDir() {
  return isPackaged ? path.join(rootDir, 'web') : path.join(rootDir, 'apps', 'web', 'dist');
}

function getMigrationsDir() {
  if (isPackaged) {
    return path.join(rootDir, 'migrations');
  }
  return path.join(rootDir, 'apps', 'backend', 'data', 'migrations');
}

function getConfigPath() {
  return path.join(app.getPath('userData'), '.env');
}

function getDatabasePath() {
  return path.join(app.getPath('userData'), 'dsa_lab.db');
}

function ensureUserData() {
  const dir = app.getPath('userData');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function seedEnvTemplate() {
  const target = getConfigPath();
  if (!fs.existsSync(target)) {
    const template = [
      'OPENAI_BASE_URL=https://api.openai.com/v1',
      'OPENAI_API_KEY=',
      'OPENAI_MODEL=gpt-4.1-mini',
      'JAVA_BIN=java',
      'JAVAC_BIN=javac',
      'EXECUTION_TIMEOUT_MS=2000',
      ''
    ].join('\n');
    fs.writeFileSync(target, template, 'utf-8');
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function waitForHealth(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: '127.0.0.1', port, path: '/api/health', timeout: 1000 },
        (res) => {
          res.resume();
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        }
      );
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error('Backend did not become ready in time'));
      } else {
        setTimeout(attempt, 250);
      }
    };

    attempt();
  });
}

async function startBackend() {
  ensureUserData();
  seedEnvTemplate();

  const port = await getFreePort();

  const env = {
    ...process.env,
    PORT: String(port),
    DATABASE_URL: getDatabasePath(),
    CONFIG_PATH: getConfigPath(),
    MIGRATIONS_DIR: getMigrationsDir(),
    WEB_DIST_DIR: getWebDistDir(),
    FRONTEND_ORIGIN: `http://127.0.0.1:${port}`
  };

  const child = utilityProcess.fork(getBackendEntry(), [], {
    env,
    stdio: 'inherit',
    serviceName: 'dsa-lab-backend'
  });

  child.on('exit', (code) => {
    if (code !== 0 && !app.isQuitting) {
      console.error(`Backend exited with code ${code}`);
    }
    backendProcess = null;
  });

  backendProcess = child;

  await waitForHealth(port);
  return port;
}

async function createWindow(port) {
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

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.isQuitting = false;

app.whenReady().then(async () => {
  try {
    const port = await startBackend();
    await createWindow(port);
  } catch (error) {
    console.error('Failed to start app:', error);
    app.quit();
    return;
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      startBackend().then(createWindow).catch(console.error);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});
