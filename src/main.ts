/* eslint-disable @typescript-eslint/no-var-requires */
const DEFAULT_MASTER_PASSWORD = 'SteamyAvoAndBakedBroccoliIsGood';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { NKriptRepo } from './data/repo';
import { cipherRequiresIv, getAvailableCiphers, handleDecryptFile, handleEncryptFile } from './encryption';
import { compileHandlebarsTemplate } from './templating';
// required to stop app opening up twice when installing via squirel
if (require('electron-squirrel-startup')) app.quit();

const repo = new NKriptRepo(DEFAULT_MASTER_PASSWORD);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
    icon: 'src/assets/icons/icon.ico',
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(join(__dirname, '../index.html'));
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  handleIpcEvents();

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function handleIpcEvents() {
  ipcMain.handle('compileHandlebarsTemplate', (_, args) => compileHandlebarsTemplate(args[0], args[1]));
  ipcMain.handle('decryptFile', handleDecryptFile);
  ipcMain.handle('encryptFile', handleEncryptFile);
  ipcMain.handle('showItemInFolder', (_, args) => shell.showItemInFolder(args[0]));
  ipcMain.handle('getAvailableCiphers', () => getAvailableCiphers());
  ipcMain.handle('cipherRequiresIv', (_, args) => cipherRequiresIv(args[0]));
  ipcMain.handle('loginToKeyVault', (_, args) => {
    try {
      repo.unlock(args[0]);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  });
  ipcMain.handle('logoutOfKeyVault', () => {
    try {
      repo.lock();
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  });
  ipcMain.handle('getAllSecrets', (_, args) => {
    try {
      return repo.getSecrets(args[0]);
    } catch (err) {
      console.log(err);
      return [];
    }
  });
  ipcMain.handle('getSecret', (_, args) => {
    try {
      return repo.getSecret(args[0], args[1]);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  });
  ipcMain.handle('deleteSecret', (_, args) => {
    try {
      repo.deleteSecret(args[0]);
    } catch (err) {
      console.log(err);
      return;
    }
  });
}

//TODO Allow for a folder to be encrypted as a feature
//TODO Investigate progress bar for large files
//TODO Secret vault with a master password
//TODO save to vault shortcut
// NOT POSSIBLE TO RESTORE IF MASTER PASSWORD LOST!!!!!!!!!!
// i want to allow user to select a master password if the app is run for thge first time
// i want the app to then encrypt the secret db using that password
// i will store a bcrypthash of the master password in the masterpassword table of a separate un-encrypted database

// everytime the user needs  to access the db,
// we will ask for the master password from the uncencrypted table,
// then need to check if supplied password is match. if not show error.

// if match, decrypt secret db decrypted, then read/write data and encrypt again when done
// maybe allow for rescure email on creation so that if master password is lost then an email can get sent to the email

//  const userKey = window.prompt(
// "Enter a master password for storing secrets. (max 32 characters)",
//  "SteamyAvoAndBakedBroccoliIsGood!"
//);
