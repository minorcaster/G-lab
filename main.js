const { app, BrowserWindow } = require('electron');
const Datastore = require('nedb-promises');
const path = require('path');
const getWifiName = require('./wifiName');

const db = Datastore.create({
  filename: path.join(app.getPath('userData'), 'appData.db'),
  autoload: true
});

let mainWindow = null;
let splash = null;

async function checkAccess() {
  try {
    const doc = await db.findOne({ key: 'access_code' });
    if (doc && doc.value === '11161219') {
      return true;
    } else {
      const wifiContainsNokov = await getWifiName();
      if (wifiContainsNokov) {
        await db.update({ key: 'access_code' }, { $set: { value: '11161219' } }, {});
        return true;
      } else {
        return false;
      }
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}


function createWindow() {
  checkAccess().then((access) => {
    if (!access) {
      const redirectWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        },
        autoHideMenuBar: true
      });
      redirectWindow.loadURL('https://chat.minorcaster.com/access_denied');
      redirectWindow.setMenuBarVisibility(false); 
      return;
    }
    if (mainWindow) return;
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      autoHideMenuBar: true
    });
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    const defaultUserAgent = mainWindow.webContents.userAgent;
    const customUserAgent = `${defaultUserAgent} NOKOV`;
    mainWindow.webContents.userAgent = customUserAgent;
    mainWindow.loadURL('https://chat.minorcaster.com/');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.on('did-finish-load', () => {
      if (splash) {
        splash.close();
      }
      mainWindow.show();
    });
  }).catch((err) => {
    console.error('Error checking access:', err);
  });
}

function showSplashScreen() {
  splash = new BrowserWindow({
    width: 128,
    height: 128,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  splash.loadURL(`file://${__dirname}/splash.html`);
  return splash;
}

app.whenReady().then(() => {
  splash = showSplashScreen();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
