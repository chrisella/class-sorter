const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const https = require('https');
const { autoUpdater } = require('electron-updater');

const GITHUB_OWNER = 'chrisella';
const GITHUB_REPO = 'class-sorter';

function fetchLatestRelease() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      headers: { 'User-Agent': 'class-sorter-app' },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          resolve({ version: release.tag_name?.replace(/^v/, ''), url: release.html_url });
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function isNewer(latest, current) {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

let mainWindow;
let checkingForUpdate = false;
let manualUpdateCheck = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_DIR);

function buildMenu() {
  const template = [
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: async () => {
            if (isPortable) {
              const release = await fetchLatestRelease();
              if (!release) {
                dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: 'Update check failed',
                  message: 'Could not reach GitHub to check for updates.',
                });
                return;
              }
              if (isNewer(release.version, app.getVersion())) {
                const { response } = await dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Update available',
                  message: `Version ${release.version} is available (you have ${app.getVersion()}).`,
                  buttons: ['Download', 'Later'],
                  defaultId: 0,
                });
                if (response === 0) shell.openExternal(release.url);
              } else {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'No update available',
                  message: `Class Sorter ${app.getVersion()} is the latest version.`,
                });
              }
              return;
            }
            if (checkingForUpdate) return;
            manualUpdateCheck = true;
            checkingForUpdate = true;
            autoUpdater.checkForUpdates().catch((err) => {
              checkingForUpdate = false;
              manualUpdateCheck = false;
              dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Update check failed',
                message: `Could not check for updates: ${err.message}`,
              });
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    checkingForUpdate = true;
  });

  autoUpdater.on('update-not-available', () => {
    checkingForUpdate = false;
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'No update available',
        message: `Class Sorter ${app.getVersion()} is the latest version.`,
      });
    }
  });

  autoUpdater.on('update-available', () => {
    checkingForUpdate = false;
    manualUpdateCheck = false;
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update available',
      message: 'A new version of Class Sorter is downloading in the background.',
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update ready',
      message: 'A new version has been downloaded. Restart to apply the update.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdatesAndNotify();
}

ipcMain.on('open-external', (_event, url) => {
  shell.openExternal(url);
});

async function checkPortableUpdateSilently() {
  const release = await fetchLatestRelease();
  if (release && isNewer(release.version, app.getVersion())) {
    mainWindow.webContents.send('update-available', { version: release.version, url: release.url });
  }
}

app.whenReady().then(() => {
  createWindow();
  buildMenu();

  if (app.isPackaged && !isPortable) {
    setupAutoUpdater();
  } else if (isPortable) {
    mainWindow.webContents.on('did-finish-load', () => checkPortableUpdateSilently());
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
