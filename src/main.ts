/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { NKriptRepo } from './repo';
import { cipherRequiresIv, getAvailableCiphers, handleDecryptFile, handleEncryptFile } from './encryption';
import { compileHandlebarsTemplate } from './templating';
// required to stop app opening up twice when installing via squirel
if (require('electron-squirrel-startup')) app.quit();

const repo = new NKriptRepo();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
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
  repo.removeSessionData();
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
    repo.endSession();
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
  ipcMain.handle('startKeyVaultSession', (_, args) => repo.startSession(args[0]));
  ipcMain.handle('endKeyVaulSession', () => repo.endSession());
  ipcMain.handle('getSecrets', (_, args) => repo.getSecrets(args[0]));
  ipcMain.handle('getSecret', (_, args) => repo.getSecret(args[0], args[1]));
  ipcMain.handle('deleteSecret', (_, args) => repo.deleteSecret(args[0], args[1]));
  ipcMain.handle('addSecret', (_, args) => repo.addSecret(args[0], args[1], args[2], args[3], args[4], args[5], args[6]));
}

//TODO Allow for a folder to be encrypted as a feature
//TODO Investigate progress bar for large files
//TODO Secret vault with a master password
//TODO save to vault shortcut