const fs = require('fs');
const path = require('path');
const os = require('os');
const rimraf = require('rimraf');

const configDirPath = path.join(os.homedir(), '.talerts');

rimraf(configDirPath, (error) => {
  if (error) return console.error('could not remove $HOME/.talerts dir, please remove it yourself to fully uninstall this cli tool.');
  console.log('uninstalled talerts.');
});
