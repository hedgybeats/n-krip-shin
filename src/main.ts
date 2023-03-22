/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { NKriptRepo } from "./repo";
import { cipherRequiresIv, getAvailableCiphers, handleDecryptFile, handleEncryptFile } from "./encryption";
import * as handlebars from "handlebars";
// required to stop app opening up twice when installing via squirel
if (require("electron-squirrel-startup")) {
  app.quit();
}

const repo = new NKriptRepo();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
    icon: "src/assets/icons/icon.ico",
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(join(__dirname, "../index.html"));
  // Open the DevTools.
  // maximise the window
  mainWindow.maximize();
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // end session just iuncase app closed unexpectedly,
  // and hashes from a previous session remain left over
  repo.endSession();
  handleIpcEvents();

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    repo.endSession();
    app.quit();
  }
});

function handleIpcEvents() {
  ipcMain.handle("compileHandlebarsTemplate", (_, args) => handlebars.compile(args[0])(args[1]));
  ipcMain.handle("decryptFile", handleDecryptFile);
  ipcMain.handle("encryptFile", handleEncryptFile);
  ipcMain.handle("showItemInFolder", (_, args) => shell.showItemInFolder(args[0]));
  ipcMain.handle("getAvailableCiphers", () => getAvailableCiphers());
  ipcMain.handle("cipherRequiresIv", (_, args) => cipherRequiresIv(args[0]));
  ipcMain.handle("hasSetMasterPassword", () => repo.hasSetMasterPassword);
  ipcMain.handle("setMasterPassword", (_, args) => repo.setMasterPassword(args[0]));
  ipcMain.handle("startKeyVaultSession", (_, args) => repo.startSession(args[0]));
  ipcMain.handle("updateMasterPassword", (_, args) => repo.updateMasterPassword(args[0], args[1]));
  ipcMain.handle("refreshVaultSession", (_, args) => repo.refreshSession(args[0]));
  ipcMain.handle("endKeyVaultSession", () => repo.endSession());
  ipcMain.handle("getSecrets", (_, args) => repo.getSecrets(args[0]));
  ipcMain.handle("getSecret", (_, args) => repo.getSecret(args[0], args[1]));
  ipcMain.handle("deleteSecret", (_, args) => repo.deleteSecret(args[0], args[1]));
  ipcMain.handle("addSecret", (_, args) => repo.addSecret(args[0], args[1], args[2], args[3], args[4], args[5], args[6]));
}

// TODO Allow for a folder to be encrypted as a feature
// TODO Investigate progress bar for large files
// TODO save to vault shortcut
// TODO add error messages on the create password, add vault item and uodate master password fields
// TODO Incorporate password expiry. Am thinking to just re-show the set password screen if the password is expired. 
//      The user could still add an item via the add vault item menu without changing the password but that 
//      is fine as then they will be forced to update their password before re-entering.
// TODO Show password hints as tooltips where applicable. 
// TODO Add buttons to make passwords visible where applicable.
