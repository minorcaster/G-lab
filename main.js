const { app, BrowserWindow } = require('electron');
const Datastore = require('nedb-promises');
const path = require('path');
const getWifiName = require('./wifiName');
const log = require('electron-log');

const db = Datastore.create({
  filename: path.join(app.getPath('userData'), 'appData.db'),
  autoload: true
});

let mainWindow = null;
let splash = null;

async function checkAccess() {
  try {
    const doc = await db.findOne({ key: 'access_code' });
    log.info('Database access_code:', doc ? doc.value : 'Not found'); // Debug line
    if (doc && doc.value === '11161219') {
      log.info('Access granted based on database'); // Debug line
      return true;
    } else {
      const wifiContainsNokov = await getWifiName();
      if (wifiContainsNokov) {
        await db.update({ key: 'access_code' }, { key: 'access_code', value: '11161219' }, { upsert: true });
        log.info('Access granted based on WiFi name'); // Debug line
        return true;
      } else {
        log.info('Access denied'); // Debug line
        return false;
      }
    }
  } catch (err) {
    log.error(err);
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
      redirectWindow.on('closed', () => {
        app.quit(); // Quit the application when the redirectWindow is closed
      });
      redirectWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
          if (splash) {
            splash.close();
          }
        }, 1500); // Delay for 1.5 seconds
      });
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
      app.quit(); // Quit the application when the main window is closed
    }); 
    const defaultUserAgent = mainWindow.webContents.userAgent;
    const customUserAgent = `${defaultUserAgent} NOKOV`;
    mainWindow.webContents.userAgent = customUserAgent;
    mainWindow.loadURL('https://chat.minorcaster.com/');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        if (splash) {
          splash.close();
        }
        mainWindow.show();
      }, 1500); // Delay for 1.5 seconds
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