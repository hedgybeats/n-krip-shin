import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import {
  handleEncryptFile,
  handleDecryptFile,
  getAvailableCiphers,
  cipherRequiresIv,
  encryptFileStream,
  decryptFileStream,
} from "./encryption";
import { shell } from "electron";
import * as sqlite3 from "sqlite3";
import { existsSync } from "fs";
import { dirname } from "path";
import { createHash } from "crypto";
let key = "SteamyAvoAndBakedBroccoliIsGood!";



key = createHash("sha256").update(key).digest("base64").substring(0, 33);
console.log(key);

const appDir = dirname(require.main.filename);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require("bcrypt");
const noDb = !existsSync("src/app.db");
const db = new sqlite3.Database("src/app.db");

db.serialize(() => {
  // create secrets table
  db.run(
    "CREATE TABLE IF NOT EXISTS secrets (name TEXT, keyHash TEXT, ivHash TEXT)"
  );

  // db.each(
  //   "SELECT rowid AS id, name, keyHash, ivHash FROM secrets",
  //   (err, row) => {
  //     console.log(row.id + ": " + row.info);
  //   }
  // );
});

db.close();

if (noDb) {
  console.log("Encrypting database");
  encryptFileStream(
    "aes-256-cbc",
    join(appDir, "src/app.db"),
    undefined,
    undefined,
    true
  );
}

// setTimeout(() => {
//   // decryptFileStream(
//   //   "aes-256-cbc",
//   //   join(appDir, "src/app.db"),
//   //   undefined,
//   //   undefined,
//   //   true
//   // );

//     db.each(
//     "SELECT rowid AS id, name, keyHash, ivHash FROM secrets",
//     (err, row) => {
//       console.log(row.id + ": " + row.info);
//     }
//   );
// }, 10000);

const bcryptHash = async (password: string, saltRounds = 10) =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function (err: unknown, hash: string) {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

const addSecretToDb = async (
  secretName: string,
  key: string,
  hash: string,
  secretPassword: string
) => {
  const keyHash = await bcryptHash(secretPassword);

  const stmt = db.prepare("INSERT INTO secrets VALUES (?, ?, ?)");
  stmt.run(secretName, secretPassword);
  stmt.finalize();
};

// required to stop app opening up twice when installing via squirel
if (require("electron-squirrel-startup")) app.quit();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
    icon: "src/assets/icons/icon.ico",
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(join(__dirname, "../index.html"));
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle("decryptFile", handleDecryptFile);
  ipcMain.handle("encryptFile", handleEncryptFile);
  ipcMain.handle("showItemInFolder", (_, args) =>
    shell.showItemInFolder(args[0])
  );
  ipcMain.handle("getAvailableCiphers", () => getAvailableCiphers());
  ipcMain.handle("cipherRequiresIv", (_, args) => cipherRequiresIv(args[0]));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
