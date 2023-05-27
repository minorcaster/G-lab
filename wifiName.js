const { exec } = require('child_process');
const os = require('os');

module.exports = function getWifiName() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let cmd = null;
    if (platform === 'win32') {
      cmd = 'netsh wlan show interfaces';
    } else if (platform === 'darwin') {
      cmd = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport -I';
    } else {
      reject(new Error('Unsupported platform'));
      return;
    }
    exec(cmd, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const match = stdout.match(/SSID: ([^\n]*)\n/);
        if (match && match[1].includes('NOKOV')) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}
